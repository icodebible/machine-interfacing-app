export const environment = {
  production: true,
  deploymentBanner: {
    enabled: false,
    code: 'PROD',
    label: 'PRODUCTION ENVIRONMENT',
    shortLabel: 'PROD',
    caption: 'Production environment',
    message: 'Production workspace.',
    details: 'Live production configuration.',
    watermark: '',
  },
} as const;
