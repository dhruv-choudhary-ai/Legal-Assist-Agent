"""
Aadhaar Number Validator
Validates Aadhaar numbers using Verhoeff algorithm
"""

import re
from typing import Tuple


class AadhaarValidator:
    """Validates Aadhaar numbers"""
    
    # Verhoeff algorithm multiplication table
    _d_table = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
        [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
        [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
        [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
        [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
        [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
        [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
        [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ]
    
    _p_table = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
        [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
        [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
        [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
        [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
        [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
        [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ]
    
    _inv_table = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]
    
    @classmethod
    def validate(cls, aadhaar_number: str) -> Tuple[bool, str]:
        """
        Validate Aadhaar number
        
        Args:
            aadhaar_number: Aadhaar number (can include spaces/hyphens)
            
        Returns:
            Tuple of (is_valid: bool, message: str)
        """
        # Remove spaces and hyphens
        aadhaar = re.sub(r'[\s-]', '', str(aadhaar_number))
        
        # Check if it's 12 digits
        if not re.match(r'^\d{12}$', aadhaar):
            return False, "Aadhaar number must be exactly 12 digits"
        
        # Check if it starts with 0 or 1
        if aadhaar[0] in ['0', '1']:
            return False, "Aadhaar number cannot start with 0 or 1"
        
        # Verify using Verhoeff algorithm
        if not cls._verify_verhoeff(aadhaar):
            return False, "Invalid Aadhaar number (checksum failed)"
        
        return True, "Valid Aadhaar number"
    
    @classmethod
    def _verify_verhoeff(cls, number: str) -> bool:
        """Verify using Verhoeff algorithm"""
        c = 0
        for i, digit in enumerate(reversed(number)):
            c = cls._d_table[c][cls._p_table[(i % 8)][int(digit)]]
        return c == 0
    
    @classmethod
    def mask_aadhaar(cls, aadhaar_number: str) -> str:
        """
        Mask Aadhaar number showing only last 4 digits
        
        Args:
            aadhaar_number: Full Aadhaar number
            
        Returns:
            Masked string like "XXXX-XXXX-1234"
        """
        aadhaar = re.sub(r'[\s-]', '', str(aadhaar_number))
        if len(aadhaar) != 12:
            return "XXXX-XXXX-XXXX"
        
        return f"XXXX-XXXX-{aadhaar[-4:]}"
    
    @classmethod
    def format_aadhaar(cls, aadhaar_number: str) -> str:
        """
        Format Aadhaar number with spaces (XXXX-XXXX-XXXX format)
        
        Args:
            aadhaar_number: Raw Aadhaar number
            
        Returns:
            Formatted string
        """
        aadhaar = re.sub(r'[\s-]', '', str(aadhaar_number))
        if len(aadhaar) != 12:
            return aadhaar
        
        return f"{aadhaar[0:4]}-{aadhaar[4:8]}-{aadhaar[8:12]}"


# Example usage
if __name__ == "__main__":
    # Test Aadhaar numbers (for testing only - not real)
    test_numbers = [
        "234567890123",  # Valid format
        "123456789012",  # Starts with 1 (invalid)
        "234567890",     # Too short
        "ABCD56789012",  # Contains letters
    ]
    
    validator = AadhaarValidator()
    for number in test_numbers:
        is_valid, message = validator.validate(number)
        print(f"{number}: {message}")
        if is_valid:
            print(f"  Masked: {validator.mask_aadhaar(number)}")
            print(f"  Formatted: {validator.format_aadhaar(number)}")
