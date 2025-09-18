interface Window {
	Alpine: import('alpinejs').Alpine;
}

interface ImportMetaEnv {
	readonly PUBLIC_API_BASE_URL: string;
	readonly JWT_SECRET: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}