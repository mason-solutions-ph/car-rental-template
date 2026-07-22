export type PaymongoCheckoutSession = {
  data: {
    id: string;
    type: string;
    attributes: {
      checkout_url: string;
      client_key?: string;
      status?: string;
      payments?: unknown[];
      line_items?: unknown[];
      metadata?: Record<string, string> | null;
    };
  };
};

export type PaymongoWebhookEvent = {
  data: {
    id: string;
    type: string;
    attributes: {
      type: string;
      data?: {
        id?: string;
        type?: string;
        attributes?: Record<string, unknown>;
      };
    };
  };
};
