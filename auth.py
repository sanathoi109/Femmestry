"""
auth.py
-------
Password hashing via Argon2id (the winner of the Password Hashing
Competition, and OWASP's current #1 recommendation over bcrypt/PBKDF2).

Argon2id is a "slow hash" - deliberately expensive in CPU + memory so
that even if the password_hash column leaks, brute-forcing it is
computationally impractical at scale. We never store or log plaintext
passwords anywhere, even transiently beyond the request that needs them.
"""

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHash

_ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  
    parallelism=4,
    hash_len=32,
    salt_len=16,
)


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password for storage. Argon2 automatically
    generates and embeds a unique random salt per call."""
    return _ph.hash(plain_password)


def verify_password(stored_hash: str, plain_password: str) -> bool:
    """Verify a login attempt against the stored Argon2id hash.
    Returns False on any mismatch or corrupted hash - never raises
    up to the caller so login routes stay simple."""
    try:
        _ph.verify(stored_hash, plain_password)
        return True
    except (VerifyMismatchError, InvalidHash):
        return False


def needs_rehash(stored_hash: str) -> bool:
    """True if the stored hash was created with weaker/older params
    than our current policy - lets us transparently upgrade hashes on
    next successful login."""
    try:
        return _ph.check_needs_rehash(stored_hash)
    except InvalidHash:
        return True