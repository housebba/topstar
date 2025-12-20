package types

import "fmt"

// NewParams creates a new Params instance.
func NewParams(mintDenom string, burnRate uint64, treasuryRate uint64, treasuryAddress string) Params {
	return Params{
		MintDenom:       mintDenom,
		BurnRate:        burnRate,
		TreasuryRate:    treasuryRate,
		TreasuryAddress: treasuryAddress,
	}
}

// DefaultParams returns a default set of parameters.
func DefaultParams() Params {
	return NewParams("umytoken", 1, 1, "")
}

// Validate validates the set of params.
func (p *Params) Validate() error {
	if err := validateMintDenom(p.MintDenom); err != nil {
		return err
	}
	if p.BurnRate+p.TreasuryRate > 100 {
		return fmt.Errorf("total tax rate (burn + treasury) cannot exceed 100%%")
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
