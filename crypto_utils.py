"""
crypto_utils.py
----------------
Field-level encryption for sensitive database columns (financial goals,
private notes, journal entries) using AES-256-GCM.

WHY AES-256-GCM:
  - AES-256 gives us a large, currently-infeasible-to-brute-force key space.
  - GCM (Galois/Counter Mode) is an "authenticated encryption" mode: it
    doesn't just hide the data, it also detects tampering. If a single
    byte of ciphertext is flipped (e.g. by a malicious DB admin or a bug),
    decryption raises InvalidTag instead of silently returning garbage.

HOW IT WORKS HERE:
  - We store one master key (32 bytes) in the environment (FINLIT_ENC_KEY).
    In production this key would live in a secrets manager (AWS KMS,
    HashiCorp Vault, etc.) - NEVER in source control.
  - Every time we encrypt a value we generate a fresh random 12-byte nonce
    (GCM's recommended nonce size). Reusing a nonce with the same key is
    catastrophic for GCM, so we prepend the nonce to the ciphertext and
    store them together as a single base64 blob: nonce || ciphertext || tag
  - This gives us "zero-knowledge-style" storage: even someone with raw
    database access cannot read goal amounts, notes, or journal text
    without the master key, which the application holds server-side only.

NOTE ON TRUE ZERO-KNOWLEDGE:
  A *literal* zero-knowledge system would derive the encryption key from
  the user's own password/passphrase (so even the server operator could
  never decrypt it). This reference implementation encrypts server-side
  with a single application master key, which protects against DB leaks,
  backups falling into the wrong hands, and curious insiders - but the
  server itself can still decrypt. The docstring in models.py flags where
  you'd swap in a per-user, password-derived key (via HKDF/Argon2) to get
  to genuine zero-knowledge if that stronger guarantee is required.
"""

import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


_ENV_KEY = os.environ.get("FINLIT_ENC_KEY")

if _ENV_KEY:
    _MASTER_KEY = base64.b64decode(_ENV_KEY)
else:

    _MASTER_KEY = AESGCM.generate_key(bit_length=256)

_AESGCM = AESGCM(_MASTER_KEY)
_NONCE_SIZE = 12 


def encrypt_field(plaintext: str) -> str:
    """Encrypt a string value for storage. Returns a base64 string safe
    to store in a normal TEXT/VARCHAR column."""
    if plaintext is None:
        return None
    nonce = os.urandom(_NONCE_SIZE)
    ciphertext = _AESGCM.encrypt(nonce, plaintext.encode("utf-8"), associated_data=None)

    blob = nonce + ciphertext
    return base64.b64encode(blob).decode("utf-8")


def decrypt_field(blob_b64: str) -> str:
    """Decrypt a value previously produced by encrypt_field(). Raises
    cryptography.exceptions.InvalidTag if the data was tampered with."""
    if blob_b64 is None:
        return None
    blob = base64.b64decode(blob_b64)
    nonce, ciphertext = blob[:_NONCE_SIZE], blob[_NONCE_SIZE:]
    plaintext = _AESGCM.decrypt(nonce, ciphertext, associated_data=None)
    return plaintext.decode("utf-8")


def generate_pseudonymous_id() -> str:
    """Generate a cryptographically random pseudonymous account ID.
    Used instead of names/emails/phone numbers so the platform never
    needs to collect real-world identifiers (zero-knowledge accounts)."""
    return "flw_" + base64.urlsafe_b64encode(os.urandom(9)).decode("utf-8").rstrip("=")