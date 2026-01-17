export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return;
  }

  const statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      statusCode,
      message,
      path: req.path,
      method: req.method
    });
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};
