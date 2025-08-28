export const logger = {
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({ 
      timestamp: new Date().toISOString(), 
      level: 'info', 
      message, 
      ...(data && { data }) 
    }));
  },

  error: (message: string, error?: any) => {
    console.error(JSON.stringify({ 
      timestamp: new Date().toISOString(), 
      level: 'error', 
      message,
      ...(error && { error: error.message || error })
    }));
  },

  warn: (message: string, data?: any) => {
    console.warn(JSON.stringify({ 
      timestamp: new Date().toISOString(), 
      level: 'warn', 
      message,
      ...(data && { data })
    }));
  }
};