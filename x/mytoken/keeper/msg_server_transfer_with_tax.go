package keeper

import (
	"context"

	"topstar/x/mytoken/types"

	"cosmossdk.io/math"
	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
)

func (k msgServer) TransferWithTax(goCtx context.Context, msg *types.MsgTransferWithTax) (*types.MsgTransferWithTaxResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	params, err := k.Params.Get(ctx)
	if err != nil {
		return nil, err
	}

	fromAddr, err := k.addressCodec.StringToBytes(msg.FromAddress)
	if err != nil {
		return nil, sdkerrors.ErrInvalidAddress.Wrapf("invalid sender address: %s", err)
	}
	toAddr, err := k.addressCodec.StringToBytes(msg.ToAddress)
	if err != nil {
		return nil, sdkerrors.ErrInvalidAddress.Wrapf("invalid recipient address: %s", err)
	}

	// Calculate tax amounts
	// Burn amount: amount * burn_rate / 100
	burnAmount := msg.Amount.Mul(math.NewInt(int64(params.BurnRate))).Quo(math.NewInt(100))
	// Treasury amount: amount * treasury_rate / 100
	treasuryAmount := msg.Amount.Mul(math.NewInt(int64(params.TreasuryRate))).Quo(math.NewInt(100))
	// Actual send amount: amount - burnAmount - treasuryAmount
	sendAmount := msg.Amount.Sub(burnAmount).Sub(treasuryAmount)

	// 1. Process Burn
	if !burnAmount.IsZero() {
		burnCoins := sdk.NewCoins(sdk.NewCoin(params.MintDenom, burnAmount))
		// Send to module account first
		if err := k.bankKeeper.SendCoinsFromAccountToModule(ctx, fromAddr, types.ModuleName, burnCoins); err != nil {
			return nil, err
		}
		// Burn from module account
		if err := k.bankKeeper.BurnCoins(ctx, types.ModuleName, burnCoins); err != nil {
			return nil, err
		}
	}

	// 2. Process Treasury
	if !treasuryAmount.IsZero() && params.TreasuryAddress != "" {
		treasuryAddr, err := k.addressCodec.StringToBytes(params.TreasuryAddress)
		if err != nil {
			return nil, sdkerrors.ErrInvalidAddress.Wrapf("invalid treasury address: %s", err)
		}
		treasuryCoins := sdk.NewCoins(sdk.NewCoin(params.MintDenom, treasuryAmount))
		if err := k.bankKeeper.SendCoins(ctx, fromAddr, treasuryAddr, treasuryCoins); err != nil {
			return nil, err
		}
	}

	// 3. Process Send
	if !sendAmount.IsZero() {
		sendCoins := sdk.NewCoins(sdk.NewCoin(params.MintDenom, sendAmount))
		if err := k.bankKeeper.SendCoins(ctx, fromAddr, toAddr, sendCoins); err != nil {
			return nil, err
		}
	}

	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			"transfer_with_tax",
			sdk.NewAttribute("sender", msg.FromAddress),
			sdk.NewAttribute("recipient", msg.ToAddress),
			sdk.NewAttribute("burn_amount", burnAmount.String()),
			sdk.NewAttribute("treasury_amount", treasuryAmount.String()),
			sdk.NewAttribute("send_amount", sendAmount.String()),
		),
	)

	return &types.MsgTransferWithTaxResponse{}, nil
}
