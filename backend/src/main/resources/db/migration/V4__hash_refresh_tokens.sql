-- Plain-text refresh tokens are no longer accepted; revoke every existing session.
UPDATE refresh_tokens SET revoked = TRUE WHERE revoked = FALSE;
