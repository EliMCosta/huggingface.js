import type { ModelData } from "./model-data";
import type { PipelineType } from "./pipelines";

/**
 * Elements configurable by a local app.
 */
export type LocalApp = {
	/**
	 * Name that appears in buttons
	 */
	prettyLabel: string;
	/**
	 * Link to get more info about a local app (website etc)
	 */
	docsUrl: string;
	/**
	 * main category of app
	 */
	mainTask: PipelineType;
	/**
	 * Whether to display a pill "macOS-only"
	 */
	macOSOnly?: boolean;

	comingSoon?: boolean;
	/**
	 * IMPORTANT: function to figure out whether to display the button on a model page's main "Use this model" dropdown.
	 */
	displayOnModelPage: (model: ModelData) => boolean;
} & (
	| {
			/**
			 * If the app supports deeplink, URL to open.
			 */
			deeplink: (model: ModelData) => URL;
	  }
	| {
			/**
			 * And if not (mostly llama.cpp), snippet to copy/paste in your terminal
			 */
			snippet: (model: ModelData) => string | string[];
	  }
);

function isGgufModel(model: ModelData) {
	return model.tags.includes("gguf");
}

const snippetVllm = (model: ModelData): string[] => {
	return [
		`
## Deploy with docker (need Docker installed) a gated model (first request access in Hugginface's model repo):
docker run --runtime nvidia --gpus all \
    --name my_vllm_container \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    --env "HUGGING_FACE_HUB_TOKEN=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" \
    -p 8000:8000 \
    --ipc=host \
    vllm/vllm-openai:latest \
    --model mistralai/Mistral-7B-Instruct-v0.1
`,
		`## Load and run the model
docker exec -it my_vllm_container bash -c "python -m vllm.entrypoints.openai.api_server --model mistralai/Mistral-7B-Instruct-v0.1 --dtype auto --api-key token-abc123"`,
	];
};

const snippetOllama = (model: ModelData): string[] => {
	return [
		`
## Install with one command:
curl -fsSL https://ollama.com/install.sh | sh
`,
		`## Load and run the model
ollama run phi3`,
	];
};

const snippetLlamacpp = (model: ModelData): string[] => {
	return [
		`
## Install and build llama.cpp with curl support
git clone https://github.com/ggerganov/llama.cpp.git 
cd llama.cpp
LLAMA_CURL=1 make
`,
		`## Load and run the model
./main \\
	--hf-repo "${model.id}" \\
	-m file.gguf \\
	-p "I believe the meaning of life is" \\
	-n 128`,
	];
};

/**
 * Add your new local app here.
 *
 * This is open to new suggestions and awesome upcoming apps.
 *
 * /!\ IMPORTANT
 *
 * If possible, you need to support deeplinks and be as cross-platform as possible.
 *
 * Ping the HF team if we can help with anything!
 */
export const LOCAL_APPS = {
	"ollama": {
		prettyLabel: "Ollama",
		docsUrl: "https://ollama.com/",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		snippet: snippetOllama,
	},
	"llama.cpp": {
		prettyLabel: "llama.cpp",
		docsUrl: "https://github.com/ggerganov/llama.cpp",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		snippet: snippetLlamacpp,
	},
	lmstudio: {
		prettyLabel: "LM Studio",
		docsUrl: "https://lmstudio.ai",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		deeplink: (model) => new URL(`lmstudio://open_from_hf?model=${model.id}`),
	},
	jan: {
		prettyLabel: "Jan",
		docsUrl: "https://jan.ai",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		deeplink: (model) => new URL(`jan://models/huggingface/${model.id}`),
	},
	backyard: {
		prettyLabel: "Backyard AI",
		docsUrl: "https://backyard.ai",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		deeplink: (model) => new URL(`https://backyard.ai/hf/model/${model.id}`),
	},
	"vllm": {
		prettyLabel: "vLLM",
		docsUrl: "https://docs.vllm.ai",
		mainTask: "text-generation",
		displayOnModelPage: isGptqModel && isAwqModel,
		snippet: snippetVllm,
	},
	drawthings: {
		prettyLabel: "Draw Things",
		docsUrl: "https://drawthings.ai",
		mainTask: "text-to-image",
		macOSOnly: true,
		displayOnModelPage: (model) =>
			model.library_name === "diffusers" && (model.pipeline_tag === "text-to-image" || model.tags.includes("lora")),
		deeplink: (model) => {
			if (model.tags.includes("lora")) {
				return new URL(`https://drawthings.ai/import/diffusers/pipeline.load_lora_weights?repo_id=${model.id}`);
			} else {
				return new URL(`https://drawthings.ai/import/diffusers/pipeline.from_pretrained?repo_id=${model.id}`);
			}
		},
	},
	diffusionbee: {
		prettyLabel: "DiffusionBee",
		docsUrl: "https://diffusionbee.com",
		mainTask: "text-to-image",
		macOSOnly: true,
		comingSoon: true,
		displayOnModelPage: (model) => model.library_name === "diffusers" && model.pipeline_tag === "text-to-image",
		deeplink: (model) => new URL(`diffusionbee://open_from_hf?model=${model.id}`),
	},
} satisfies Record<string, LocalApp>;

export type LocalAppKey = keyof typeof LOCAL_APPS;
