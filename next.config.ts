import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['ssh2', 'dockerode'],
};

// "Owijamy" naszą konfigurację wtyczką do tłumaczeń
export default withNextIntl(nextConfig);