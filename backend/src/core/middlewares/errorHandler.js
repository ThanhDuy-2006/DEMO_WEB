import logger from '../logger.js';
import { AppError } from '../errors.js';

// Differentiate error responses based on environment
const sendErrorDev = (err, req, res) => {
  return res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
  
  // Programming or other unknown error: don't leak error details
  // 1. Log generic error info into our Winston system
  logger.error('ERROR 💥', err);
  
  // 2. Send generic message
  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!'
  });
};

export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log all errors using Wiston logger
  if(err.statusCode >= 500) {
     logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${err.stack}`);
  } else {
     logger.warn(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  }
  
  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.name = err.name;
    error.message = err.message;

    // Handle Mongoose / DB specific errors here by converting them to AppError
    // Example: JWT Error
    if (error.name === 'JsonWebTokenError') error = new AppError('Invalid token. Please log in again!', 401);
    if (error.name === 'TokenExpiredError') error = new AppError('Your token has expired! Please log in again.', 401);

    sendErrorProd(error, req, res);
  } else {
    sendErrorDev(err, req, res);
  }
};
