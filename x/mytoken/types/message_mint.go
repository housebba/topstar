package types

import (
	"cosmossdk.io/errors"
	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"
)

var _ sdk.Msg = &MsgMint{}

// ValidateBasic performs stateless validation on MsgMint.
func (msg *MsgMint) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(msg.Creator); err != nil {
		return errors.Wrapf(sdkerrors.ErrInvalidAddress, "invalid creator address (%s)", err)
	}

	// Amount must be a positive value.
	if !msg.Amount.IsPositive() {
		return errors.Wrap(sdkerrors.ErrInvalidRequest, "amount must be positive")
	}

	return nil
}
