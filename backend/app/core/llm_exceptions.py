"""OpenRouter / OpenAI SDK errors surfaced to clients."""

USER_MESSAGE_OPENROUTER_QUOTA = (
    "Limite de requêtes OpenRouter atteinte (quota gratuit dépassé). "
    "Ajoutez des crédits sur https://openrouter.ai/settings ou réessayez après la réinitialisation quotidienne."
)


def is_rate_limit_error(exc: BaseException) -> bool:
    from openai import APIStatusError, RateLimitError

    if isinstance(exc, RateLimitError):
        return True
    return isinstance(exc, APIStatusError) and getattr(exc, "status_code", None) == 429
