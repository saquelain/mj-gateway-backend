export interface ProviderResponse {
    success: boolean;
    data?: Record<string, unknown>;
    providerRef?: string;
    httpStatus: number;
  }
  
  // Mock adapter — replace internals with real SurePass HTTP call once credentials are available.
  // Signature and response shape are what the pipeline depends on — swapping implementation
  // later requires no changes outside this file.
  export async function verifyPan(panNumber: string): Promise<ProviderResponse> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 200));
  
    if (!panNumber || panNumber.length !== 10) {
      return { success: false, httpStatus: 400 };
    }
  
    return {
      success: true,
      httpStatus: 200,
      providerRef: 'mock_' + Date.now(),
      data: {
        pan_number: panNumber,
        full_name: 'MOCK TEST NAME',
        status: 'valid',
      },
    };
  }