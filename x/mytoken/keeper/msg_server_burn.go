package keeper

import (
	"context"

	"topstar/x/mytoken/types"

	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
)

func (k msgServer) Burn(goCtx context.Context, msg *types.MsgBurn) (*types.MsgBurnResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	params, err := k.Params.Get(ctx)
	if err != nil {
		return nil, err
	}

	creatorAddr, err := k.addressCodec.StringToBytes(msg.Creator)
	if err != nil {
		return nil, sdkerrors.ErrInvalidAddress.Wrapf("invalid creator address: %s", err)
	}

	// 소각할 코인(토큰)을 정의합니다.
	burnCoin := sdk.NewCoin(params.MintDenom, msg.Amount)
	burnCoins := sdk.NewCoins(burnCoin)

	// 1. 사용자의 지갑에 소각할 만큼의 토큰이 있는지 확인하고, 있다면 모듈 계정으로 전송합니다.
	if err := k.bankKeeper.SendCoinsFromAccountToModule(ctx, creatorAddr, types.ModuleName, burnCoins); err != nil {
		return nil, err
	}

	// 2. 모듈 계정으로 들어온 토큰을 소각(제거)합니다.
	if err := k.bankKeeper.BurnCoins(ctx, types.ModuleName, burnCoins); err != nil {
		return nil, err
	}

	// 성공 이벤트 발생
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			sdk.EventTypeMessage,
			sdk.NewAttribute(sdk.AttributeKeyModule, types.ModuleName),
			sdk.NewAttribute(sdk.AttributeKeySender, msg.Creator),
			sdk.NewAttribute(types.AttributeKeyAmount, burnCoins.String()),
		),
	)

	return &types.MsgBurnResponse{}, nil
}
