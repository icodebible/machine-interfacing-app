export const environment = {
  production: false,
  deploymentBanner: {
    enabled: true,
    code: 'DEMO',
    label: 'DEMO ENVIRONMENT',
    shortLabel: 'DEMO',
    caption: 'Testing environment',
    message: 'For demonstration and testing only. Do not use for production data.',
    details:
      'This workspace may contain simulated, temporary, or test-only records and integrations.',
    // watermark:
    //   'DEMO · TESTING ONLY · NOT FOR PRODUCTION DATA',
    watermark: 'MOH · NPHL · DEMO · TESTING ONLY',
  },
} as const;
