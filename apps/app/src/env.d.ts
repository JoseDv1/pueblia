interface Window {
	Alpine: import('alpinejs').Alpine;
}

interface ImportMetaEnv {
	readonly PUBLIC_API_BASE_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}