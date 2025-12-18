package keeper

import (
	"context"

	"topstar/x/mytoken/types"

	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
)

func (k msgServer) Mint(goCtx context.Context, msg *types.MsgMint) (*types.MsgMintResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	params, err := k.Params.Get(ctx)
	if err != nil {
		return nil, err
	}

	// Since Amount is already math.Int from the proto definition, we use it directly
	fullCoin := sdk.NewCoin(params.MintDenom, msg.Amount)
	coins := sdk.NewCoins(fullCoin)

	// Mint coins to module account
	// The MintCoins function requires the module name to mint TO.
	// Ensure the module account has "minter" permission in app.go, but standard modules usually can if they are bank.
	// Wait, x/mytoken needs Minter permission.
	if err := k.bankKeeper.MintCoins(ctx, types.ModuleName, coins); err != nil {
		return nil, err
	}

	// Send coins to creator
	creatorAddr, err := k.addressCodec.StringToBytes(msg.Creator)
	if err != nil {
		return nil, sdkerrors.ErrInvalidAddress.Wrapf("invalid creator address: %s", err)
	}

	recipient := sdk.AccAddress(creatorAddr)

	if err := k.bankKeeper.SendCoinsFromModuleToAccount(ctx, types.ModuleName, recipient, coins); err != nil {
		return nil, err
	}

	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			sdk.EventTypeMessage,
			sdk.NewAttribute(sdk.AttributeKeyModule, types.ModuleName),
			sdk.NewAttribute(sdk.AttributeKeySender, msg.Creator),
			sdk.NewAttribute(types.AttributeKeyAmount, coins.String()),
			sdk.NewAttribute(types.AttributeKeyRecipient, recipient.String()),
		),
	)

	return &types.MsgMintResponse{}, nil
}
