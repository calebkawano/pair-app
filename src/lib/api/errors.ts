export class ClientApiError extends Error {
  constructor(public status: number, message = 'Request failed') {
    super(message);
    this.name = 'ClientApiError';
  }
} 