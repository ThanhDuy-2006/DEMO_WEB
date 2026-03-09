class ApiResponse {
  constructor(statusCode, status, message, data = null) {
    this.statusCode = statusCode;
    this.status = status;
    this.message = message;
    if (data) {
      this.data = data;
    }
  }

  send(res) {
    return res.status(this.statusCode).json({
      status: this.status,
      message: this.message,
      ...(this.data && { data: this.data })
    });
  }
}

class SuccessResponse extends ApiResponse {
  constructor(message = 'Success', data = null, statusCode = 200) {
    super(statusCode, 'success', message, data);
  }
}

class CreatedResponse extends ApiResponse {
  constructor(message = 'Created successfully', data = null) {
    super(201, 'success', message, data);
  }
}

export {
  ApiResponse,
  SuccessResponse,
  CreatedResponse
};
