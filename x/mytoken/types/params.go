package types

import "fmt"

// NewParams creates a new Params instance.
func NewParams(mintDenom string) Params {
	return Params{
		MintDenom: mintDenom,
	}
}

// DefaultParams returns a default set of parameters.
func DefaultParams() Params {
	return NewParams("umytoken")
}

// Validate validates the set of params.
func (p *Params) Validate() error {
	if err := validateMintDenom(p.MintDenom); err != nil {
		return err
	}
	return nil
}

func validateMintDenom(i interface{}) error {
	v, ok := i.(string)
	if !ok {
		return fmt.Errorf("invalid parameter type: %T", i)
	}

	if v == "" {
		return fmt.Errorf("mint denom cannot be empty")
	}

	return nil
}
