class NotFound(Exception):
    def __init__(self, resource: str = "Resource"):
        self.resource = resource
        super().__init__(f"{resource} not found")


class UpstreamError(Exception):
    def __init__(self, message: str = "Service temporarily unavailable"):
        self.message = message
        super().__init__(message)
