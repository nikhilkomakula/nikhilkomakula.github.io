/* ============================================================
   Digital Twin — Nikhil Komakula
   Chat assistant answering questions about Nikhil's professional
   background. Two modes:
   - Remote (window.NK_TWIN_ENDPOINT set): questions go to a Cloudflare
     Worker proxy backed by Google Gemini, grounded in twin-context.md.
   - Local (endpoint empty or unreachable): retrieval over the built-in
     knowledge base below; nothing leaves the browser.
   ============================================================ */
(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Gemini-backed proxy endpoint (Cloudflare Worker). When set, questions go
  // to the LLM grounded in twin-context.md; when empty or unreachable, the
  // widget falls back to the built-in local retrieval knowledge base.
  const ENDPOINT = (window.NK_TWIN_ENDPOINT || "").replace(/\/+$/, "");

  /* ============================================================
     KNOWLEDGE BASE
     ============================================================ */
  const KB = [
    {
      id: "current-role",
      keywords: ["databricks", "current", "now", "today", "fde", "forward deployed", "senior ai engineer", "present role", "current role", "current job", "work now", "doing now"],
      answer:
        "Nikhil is a **Senior AI Engineer at Databricks** (AI Forward Deployed Engineer) since **December 2025**, based in Hyderabad, India.\n\n" +
        "• Serves as a trusted technical advisor to global customers, building and productionizing first-of-its-kind GenAI applications on Databricks\n" +
        "• Builds end-to-end GenAI solutions — multi-agent systems, RAG pipelines, Text2SQL, and LLM fine-tuning — with Agent Bricks, Genie Spaces, Multi-Agent Supervisor, MLflow, Vector Search, Model Serving, and Lakebase\n" +
        "• Owns production rollouts with evaluation-driven quality: accuracy, groundedness, latency, scalability, observability, and governance\n" +
        "• Collaborates with product and engineering teams to shape the product roadmap",
      suggestions: ["What did he do at IBM?", "What are his Databricks skills?", "Tell me about his projects"]
    },
    {
      id: "ibm-delivery-consultant",
      keywords: ["ibm", "delivery consultant", "watsonx", "watson", "2021", "2025", "genai at ibm", "before databricks"],
      answer:
        "At **IBM India (Sep 2021 – Nov 2025)**, Nikhil was a **Delivery Consultant (AI/ML/GenAI)**:\n\n" +
        "• Engineered AI/ML/GenAI and RAG solutions with IBM Watsonx — conversational assistants that increased adoption by 30% and reduced costs by 25% in financial services\n" +
        "• Fine-tuned LLM and BERT-based models, improving domain-specific accuracy by 35% and overall model performance by 20%\n" +
        "• Implemented scalable ML pipelines with Docker and MLflow, reducing deployment time by 50%\n" +
        "• Established AI governance practices with IBM watsonx.governance while mentoring teams",
      suggestions: ["What projects did he build at IBM?", "Tell me about his OpenPages experience", "What is he doing at Databricks?"]
    },
    {
      id: "surestep",
      keywords: ["surestep", "solutions architect canada", "markham", "2020", "grc implementation"],
      answer:
        "At **SureStep Systems Integration (May 2020 – Sep 2021)**, Nikhil was a **Senior Solutions Architect** (Markham, ON, Canada):\n\n" +
        "• Led an end-to-end OpenPages GRC implementation for a leading financial institution — 35% faster compliance reporting and $500K+ annual savings\n" +
        "• Integrated OpenPages workflows with enterprise systems, improving real-time risk-monitoring efficiency by 40%\n" +
        "• Advised clients on GRC modernization roadmaps across ORM, RCM, and IAM modules\n" +
        "• Automated data loads with FastMap and built executive Cognos dashboards, cutting data-prep and reporting effort by ~30%",
      suggestions: ["What is OpenPages?", "What did he do at IBM before that?", "What are his GRC skills?"]
    },
    {
      id: "openpages-era",
      keywords: ["openpages", "grc", "risk management", "compliance platform", "solutions architect", "consulting engineer", "2012", "2010", "orm", "rcm", "fcm", "iam module", "regulatory"],
      answer:
        "Nikhil spent a **decade in the IBM OpenPages GRC ecosystem** (2010–2020):\n\n" +
        "**Solutions Architect, IBM India (2012–2020):** Architected 15+ OpenPages implementations across Operational Risk (ORM), Regulatory Compliance (RCM), Policy & Compliance (PCM), Internal Audit (IAM), and Financial Controls/SOX (FCM) for global banks and insurers; designed reusable blueprints that cut implementation timelines ~25%; led 6.x→8.x upgrades; served as practice-area lead.\n\n" +
        "**Lead Consulting Engineer, IBM Corp, Littleton MA (2010–2012):** Hands-on ORM and SOX implementations — RCSAs, KRI libraries, loss-event workflows, custom Java triggers, Cognos reports, and FastMap data onboarding that cut migration cycles from weeks to days.",
      suggestions: ["What did he do after OpenPages?", "Tell me about the Compliance Assistant project", "What certifications does he have?"]
    },
    {
      id: "early-career",
      keywords: ["early career", "first job", "accolite", "haller", "hht", "java developer", "2009", "saferstore", "gm+view", "flex", "start career", "career start", "beginning"],
      answer:
        "Before his full-time career began, Nikhil completed **internships in enterprise Java and web engineering in Texas** (2009–2010):\n\n" +
        "**Haller Harlan & Taylor — Software Programmer, Internship (Plano, TX):** Developed GM+View, a debt-management application integrating GoldMine CRM with the Collector System, with Flex/ActionScript UI components and SQL Server via JDBC.\n\n" +
        "**Accolite — Java Developer, Internship (Richardson, TX):** Developed SaferStore, a web-based rebate-management module that digitized billback and rebate tracking, replacing error-prone manual reconciliation.\n\n" +
        "His full-time career started with **OpenPages/IBM in April 2010**.",
      suggestions: ["How many years of experience does he have?", "Where did he study?", "What's his current role?"]
    },
    {
      id: "experience-summary",
      keywords: ["experience", "career", "background", "journey", "history", "worked", "companies", "employers", "how many years", "years of experience", "summary", "overview", "resume", "cv", "walk me through"],
      answer:
        "Nikhil has **over 15 years of full-time experience in enterprise IT** (starting with OpenPages/IBM in 2010), with an arc from GRC solution architecture → enterprise AI:\n\n" +
        "• **Databricks** — Senior AI Engineer, AI FDE (Dec 2025 – present)\n" +
        "• **IBM India** — Delivery Consultant, AI/ML/GenAI (2021–2025)\n" +
        "• **SureStep** — Senior Solutions Architect (2020–2021)\n" +
        "• **IBM India** — Solutions Architect (2012–2020)\n" +
        "• **IBM Corp, USA** — Lead Consulting Engineer (2010–2012)\n" +
        "• **Internships** — Java/web engineering in Texas (2009–2010)\n\n" +
        "Ask me about any of these roles for details!",
      suggestions: ["What is he doing at Databricks?", "Tell me about his AI projects", "What are his top skills?"]
    },
    {
      id: "skills-overview",
      keywords: ["skills", "skill", "top skills", "expertise", "strengths", "good at", "specialties", "specialization", "capabilities", "knows", "toolbox"],
      answer:
        "Nikhil's skills span **six areas**:\n\n" +
        "• **Generative AI & Agents** — LLMs, RAG, multi-agent systems, PEFT/LoRA, LangChain\n" +
        "• **Databricks Ecosystem** — MLflow, Vector Search, Model Serving, Agent Bricks, Genie Spaces\n" +
        "• **MLOps · LLMOps · CI/CD** — Docker, Kubernetes, GitHub Actions, model monitoring\n" +
        "• **Cloud Platforms** — Databricks, AWS, Azure, GCP, IBM watsonx\n" +
        "• **Languages & Frameworks** — Python, Java, SQL, ReactJS, PyTorch\n" +
        "• **Data & Databases** — PostgreSQL, MongoDB, Milvus, Pandas\n\n" +
        "Ask about any area for details!",
      suggestions: ["What are his GenAI skills?", "What are his Databricks skills?", "What are his MLOps skills?"]
    },
    {
      id: "skills-genai",
      keywords: ["genai", "generative ai", "llm", "rag", "agents", "agentic", "fine-tuning", "fine tuning", "lora", "peft", "prompt", "langchain", "hugging face", "transformers", "bert", "vector database", "embeddings", "nlp"],
      answer:
        "Nikhil's **Generative AI & Agents** toolbox:\n\n" +
        "• **LLMs & fine-tuning:** PEFT, LoRA, prompt engineering, BERT, Transformers\n" +
        "• **RAG & retrieval:** LangChain, Hugging Face, vector databases (Milvus), rerankers, evaluation frameworks\n" +
        "• **AI agents:** multi-agent systems, agentic workflows, Text2SQL\n" +
        "• Production focus: accuracy, groundedness, latency, observability, and governance",
      suggestions: ["What are his Databricks skills?", "Tell me about the IntelliBot project", "What cloud platforms does he know?"]
    },
    {
      id: "skills-databricks",
      keywords: ["databricks skills", "mlflow", "vector search", "model serving", "genie", "agent bricks", "unity catalog", "lakebase", "spark", "delta lake", "multi-agent supervisor", "ai gateway", "databricks ecosystem"],
      answer:
        "Nikhil works across the **Databricks ecosystem**:\n\n" +
        "• MLflow · Vector Search · Model Serving\n" +
        "• Agent Bricks · Genie Spaces · Multi-Agent Supervisor\n" +
        "• Unity AI Gateway · Unity Catalog · Lakebase\n" +
        "• Spark · Delta Lake\n\n" +
        "He's also a **Databricks Certified Generative AI Engineer Associate**.",
      suggestions: ["What is he building at Databricks?", "What other certifications does he have?", "What are his GenAI skills?"]
    },
    {
      id: "skills-mlops",
      keywords: ["mlops", "llmops", "ci/cd", "cicd", "docker", "kubernetes", "github actions", "jenkins", "dvc", "deployment", "monitoring", "explainability", "pipeline"],
      answer:
        "Nikhil's **MLOps / LLMOps** expertise:\n\n" +
        "• Docker, Kubernetes, GitHub Actions, Jenkins, DVC\n" +
        "• Model monitoring, explainability, AI governance\n" +
        "• End-to-end pipelines: preprocessing → training → tuning → deployment\n" +
        "• Track record: 50% deployment-time reduction at IBM; reusable accelerators and CI/CD patterns at Databricks",
      suggestions: ["Tell me about the AI Governance project", "What cloud platforms does he use?", "What is he doing at Databricks?"]
    },
    {
      id: "skills-cloud",
      keywords: ["cloud", "aws", "azure", "gcp", "google cloud", "sagemaker", "lambda", "vertex", "platforms"],
      answer:
        "Nikhil has worked across **5 cloud & AI platforms**:\n\n" +
        "• **Databricks** (current focus)\n" +
        "• **AWS** — SageMaker, Lambda, S3, ECS\n" +
        "• **Azure** — ML, Databricks\n" +
        "• **GCP** — Vertex AI\n" +
        "• **IBM** — watsonx, Watson Studio, Assistant, Discovery\n\n" +
        "He holds ML/AI certifications on four of them (Databricks, GCP, AWS, Azure) plus IBM.",
      suggestions: ["What certifications does he have?", "What are his programming languages?", "Tell me about his projects"]
    },
    {
      id: "skills-languages",
      keywords: ["programming", "languages", "python", "java", "sql", "reactjs", "react", "pytorch", "scikit", "tensorflow", "fastapi", "flask", "streamlit", "gradio", "code", "tech stack", "stack"],
      answer:
        "Nikhil's **languages & frameworks**:\n\n" +
        "• **Languages:** Python, Java, SQL, ReactJS\n" +
        "• **ML:** PyTorch, Scikit-learn, Hugging Face\n" +
        "• **Web/API:** FastAPI, Flask, Streamlit, Gradio\n" +
        "• **Data:** Pandas, NumPy, Matplotlib, Seaborn, Plotly\n" +
        "• **Databases:** PostgreSQL, MySQL, MongoDB, Milvus, Oracle, DB2",
      suggestions: ["What are his GenAI skills?", "What projects has he built?", "How can I contact him?"]
    },
    {
      id: "project-compliance-assistant",
      keywords: ["compliance assistant", "regulatory data", "watson discovery", "tuning studio", "granite", "llama"],
      answer:
        "**Compliance Assistant** (RegTech · GenAI):\n\n" +
        "A regulatory document repository and conversational assistant using Watson Discovery, watsonx.ai, and fine-tuned LLMs (LLaMA, Granite) with PEFT/LoRA.\n\n" +
        "• 30% reduction in manual compliance processing\n" +
        "• 40% faster user response via conversational search\n" +
        "• 35% accuracy boost in regulatory classification",
      suggestions: ["Tell me about other projects", "What is his GRC background?", "What LLMs has he fine-tuned?"]
    },
    {
      id: "project-governance",
      keywords: ["governance project", "ai governance", "cross-cloud", "factsheets", "openscale", "model lifecycle", "bias"],
      answer:
        "**Cross-Cloud AI Governance** (MLOps · Governance):\n\n" +
        "An MLOps pipeline for onboarding ML models from Azure & GCP into IBM watsonx.governance — unified, cross-cloud model lifecycle management.\n\n" +
        "• 25% faster model governance processes\n" +
        "• Automated CI/CD with AI Factsheets, MLflow & Databricks\n" +
        "• Real-time monitoring, explainability & bias mitigation via OpenScale",
      suggestions: ["What are his MLOps skills?", "Tell me about the IntelliBot", "What is he doing at Databricks?"]
    },
    {
      id: "project-intellibot",
      keywords: ["intellibot", "chatbot", "rag chatbot", "milvus", "mistral", "support tickets", "github project"],
      answer:
        "**OpenPages IntelliBot** (RAG · Chatbot) — his open-source showcase:\n\n" +
        "An enterprise RAG chatbot integrating Watson Assistant with Watsonx GenAI (Granite, LLaMA, Mistral) — LangChain, Milvus vector DB, and automated evaluation via OpenScale.\n\n" +
        "• 30% boost in user satisfaction\n" +
        "• 25% reduction in support tickets\n" +
        "• Automated eval: relevancy, similarity & faithfulness\n\n" +
        "Code: github.com/nikhilkomakula/llm-rag-op-chatbot",
      suggestions: ["What other projects has he built?", "What are his RAG skills?", "How can I contact him?"]
    },
    {
      id: "project-pii",
      keywords: ["pii", "privacy", "sensitive", "token classification", "gdpr", "hipaa", "soc 2", "detection"],
      answer:
        "**PII Detector** (NLP · Privacy):\n\n" +
        "A scalable PII detection pipeline with transformer-based BERT token classification, deployed as Dockerized REST microservices on AWS ECS with full CI/CD.\n\n" +
        "• Granular sensitive-entity extraction from unstructured text\n" +
        "• K-fold CV & hyperparameter optimization for precision\n" +
        "• Privacy-aware deployment aligned to GDPR, HIPAA & SOC 2 controls",
      suggestions: ["Tell me about other projects", "What are his NLP skills?", "What cloud platforms does he use?"]
    },
    {
      id: "project-risk-estimator",
      keywords: ["risk loss", "loss estimator", "operational risk", "xgboost", "lightgbm", "banking ml", "ensemble"],
      answer:
        "**Operational Risk Loss Estimator** (FinTech · ML):\n\n" +
        "An NLP-powered loss estimator for banking, with a serverless ETL pipeline (S3 + Lambda + DVC) and optimized ensemble models tracked in MLflow.\n\n" +
        "• 20% improvement in incident-driven loss-estimation accuracy\n" +
        "• Versioned, reproducible risk-modeling workflows\n" +
        "• Interpretable ensembles: XGBoost & LightGBM",
      suggestions: ["What other ML projects has he done?", "What is his banking domain experience?", "What are his MLOps skills?"]
    },
    {
      id: "project-semantic-search",
      keywords: ["semantic search", "universal sentence encoder", "use embeddings", "contextual search", "duplicate detection"],
      answer:
        "**Semantic Search for OpenPages** (NLP · Semantic Search):\n\n" +
        "Embedding-based semantic search for IBM OpenPages using Universal Sentence Encoder vectors — retrieving GRC records beyond keyword matching, built before the RAG wave.\n\n" +
        "• ~30% higher precision and ~25% better recall in internal relevance benchmarks\n" +
        "• ~40% fewer duplicate-record false positives via embedding similarity\n" +
        "• ~30% faster search responsiveness",
      suggestions: ["Tell me about his vector search skills", "What other projects has he built?", "What is he doing at Databricks?"]
    },
    {
      id: "project-nmt",
      keywords: ["machine translation", "nmt", "bleu", "german", "seq2seq", "encoder-decoder", "attention", "lstm project", "translation"],
      answer:
        "**Neural Machine Translation** (Deep Learning · academic):\n\n" +
        "A German-to-English translation project at UT Austin comparing RNN, LSTM, and GRU encoder-decoder models with attention.\n\n" +
        "• Reached ~45 BLEU on the course evaluation set, outperforming baseline seq2seq models\n" +
        "• Attention-based decoding for longer-sentence quality",
      suggestions: ["Where did he study?", "What are his deep learning skills?", "Tell me about his enterprise projects"]
    },
    {
      id: "project-nlu-manager",
      keywords: ["nlu model manager", "watson nlu", "model manager", "self-service", "classification model"],
      answer:
        "**Watson NLU Model Manager** (NLP · Self-Service Tooling):\n\n" +
        "A self-service OpenPages utility that put Watson NLU classification model management in business users' hands — create, update, delete, list, and test models without IT admins, cURL, or Watson Studio.\n\n" +
        "• Removed IT-admin dependency from routine model lifecycle tasks\n" +
        "• In-context text analysis with classification suggestions and confidence scores",
      suggestions: ["What other tooling has he built?", "What are his NLP skills?", "Tell me about his projects"]
    },
    {
      id: "projects-overview",
      keywords: ["projects", "portfolio", "built", "showcase", "work samples", "what has he built", "achievements"],
      answer:
        "Nikhil's featured projects span **enterprise GenAI, MLOps, and NLP**:\n\n" +
        "• **Compliance Assistant** — regulatory GenAI with fine-tuned LLMs\n" +
        "• **Cross-Cloud AI Governance** — Azure/GCP → watsonx.governance MLOps\n" +
        "• **OpenPages IntelliBot** — enterprise RAG chatbot (open source)\n" +
        "• **PII Detector** — BERT-based privacy pipeline on AWS\n" +
        "• **Operational Risk Loss Estimator** — NLP + ensembles for banking\n" +
        "• **Semantic Search for OpenPages** — USE embeddings, pre-RAG era\n" +
        "• **Neural Machine Translation** — seq2seq + attention at UT Austin\n" +
        "• **Watson NLU Model Manager** — self-service ML tooling\n\n" +
        "Ask about any of them by name!",
      suggestions: ["Tell me about the IntelliBot", "Tell me about the Compliance Assistant", "What are his top skills?"]
    },
    {
      id: "certifications",
      keywords: ["certification", "certifications", "certified", "certificate", "certs", "cert", "credentials", "databricks certified", "gcp certified", "aws certified", "azure certified"],
      answer:
        "Nikhil holds **5 AI & ML certifications**:\n\n" +
        "• **Databricks** Certified Generative AI Engineer Associate\n" +
        "• **GCP** Professional Machine Learning Engineer\n" +
        "• **AWS** Certified Machine Learning — Specialty\n" +
        "• **Azure** Data Scientist Associate\n" +
        "• **IBM** Certified Data Scientist — Machine Learning Specialist",
      suggestions: ["Where did he study?", "What awards has he won?", "What are his cloud skills?"]
    },
    {
      id: "awards",
      keywords: ["award", "awards", "recognition", "honors", "achievement", "oia", "otaa"],
      answer:
        "Nikhil has earned **6 industry awards**:\n\n" +
        "• **IBM Outstanding Innovation Award** (OIA)\n" +
        "• **IBM Outstanding Technical Achievement Award** (OTAA) ×2\n" +
        "• **IBM Lab Services Award** — Restlessly Reinvent\n" +
        "• **Manager's Choice Awards** — Put the Client First · Restlessly Reinvent (×2)",
      suggestions: ["What certifications does he have?", "Tell me about his experience", "What projects has he built?"]
    },
    {
      id: "education",
      keywords: ["education", "education background", "educational", "study", "studied", "studies", "degree", "degrees", "qualification", "qualifications", "academic", "university", "college", "ut austin", "ut dallas", "masters", "bachelor", "vasavi", "school", "graduate"],
      answer:
        "Nikhil's **education**:\n\n" +
        "• **The University of Texas at Austin** — Post Graduate Program, AI & Machine Learning\n" +
        "• **The University of Texas at Dallas** — M.S. in Computer Engineering\n" +
        "• **Vasavi College of Engineering** — B.E. in Electrical & Electronics Engineering",
      suggestions: ["What certifications does he have?", "How many years of experience?", "What's his current role?"]
    },
    {
      id: "contact",
      keywords: ["contact", "email", "phone", "reach", "hire", "connect", "linkedin", "github", "whatsapp", "call", "message", "touch", "available", "talk"],
      answer:
        "You can reach Nikhil at:\n\n" +
        "• **Email:** nikhil.komakula@outlook.com\n" +
        "• **Phone / WhatsApp:** +91 89853 72727\n" +
        "• **LinkedIn:** linkedin.com/in/nikhilkomakula\n" +
        "• **GitHub:** github.com/nikhilkomakula\n" +
        "• **X:** x.com/nikhilkomakula\n\n" +
        "He's based in **Hyderabad, India** and happy to talk enterprise GenAI, agentic systems, and production AI.",
      suggestions: ["What's his current role?", "What are his top skills?", "Tell me about his experience"]
    },
    {
      id: "location",
      keywords: ["location", "where", "based", "live", "city", "hyderabad", "india", "timezone", "remote"],
      answer:
        "Nikhil is based in **Hyderabad, Telangana, India** (IST timezone). He works with **global customers** at Databricks and has previously worked in the USA (Texas, Massachusetts) and with Canadian clients.",
      suggestions: ["How can I contact him?", "What's his current role?", "Tell me about his career journey"]
    },
    {
      id: "spoken-languages",
      keywords: ["speak", "speaks", "spoken", "he speak", "you speak", "languages spoken", "spoken languages", "telugu", "hindi", "english", "language spoken", "mother tongue", "native language"],
      answer:
        "Nikhil speaks **Telugu** (native), **English** (full professional proficiency), and **Hindi** (limited working proficiency).",
      suggestions: ["Where is he based?", "How can I contact him?"]
    },
    {
      id: "interests",
      keywords: ["hobby", "hobbies", "interests", "fun", "outside work", "photography", "travel", "fitness", "personal"],
      answer:
        "Outside work, Nikhil enjoys **photography, travel, and fitness**. Professionally, he's passionate about mentoring practitioners, technical enablement, and translating emerging AI capabilities into meaningful business outcomes.",
      suggestions: ["What's his current role?", "How can I contact him?"]
    },
    {
      id: "opportunities",
      keywords: ["opportunities", "opportunity", "hiring", "open to work", "open to", "freelance", "consulting engagement", "collaborate", "collaboration", "job offer", "recruit", "recruiting", "interested in", "work together", "speaking", "conference", "mentoring"],
      answer:
        "Nikhil is always happy to connect about **enterprise GenAI, agentic systems, production AI, mentoring, and speaking opportunities**.\n\n" +
        "The best way to start a conversation:\n\n" +
        "• **Email:** nikhil.komakula@outlook.com\n" +
        "• **LinkedIn:** linkedin.com/in/nikhilkomakula\n\n" +
        "He typically responds within a day or two.",
      suggestions: ["What's his current role?", "What are his top skills?", "Tell me about his experience"]
    },
    {
      id: "about-twin",
      keywords: ["who are you", "what are you", "digital twin", "bot", "assistant", "ai twin", "chatbot", "are you real", "are you ai", "how do you work"],
      answer:
        "I'm Nikhil's **digital twin** 🤖 — a chat assistant built into this portfolio that answers questions about his professional background: experience, skills, projects, certifications, and how to reach him.\n\n" +
        "I run entirely in your browser — your questions never leave this page. What would you like to know?",
      suggestions: ["Tell me about his experience", "What are his top skills?", "How can I contact him?"]
    }
  ];

  const GREETING_RE = /^(hi|hii+|hello|hey|heya|yo|howdy|good\s*(morning|afternoon|evening)|namaste|hola)\b/i;
  const THANKS_RE = /\b(thanks|thank you|thx|ty|cheers|appreciate)\b/i;
  const BYE_RE = /^(bye|goodbye|see you|later|ciao)\b/i;

  const WELCOME =
    "Hi! 👋 I'm **Nikhil's digital twin**. Ask me anything about his professional background — experience, skills, projects, certifications, or how to get in touch.";

  const DEFAULT_SUGGESTIONS = [
    "Walk me through his experience",
    "What is he doing at Databricks?",
    "What are his top skills?",
    "How can I contact him?"
  ];

  const FALLBACK =
    "Hmm, I don't have a good answer for that one — I only know Nikhil's professional background. Try asking about his **experience**, **skills**, **projects**, **certifications**, or **contact info**.";

  /* ============================================================
     RETRIEVAL ENGINE
     ============================================================ */
  const STOPWORDS = new Set(["the", "a", "an", "is", "are", "was", "were", "do", "does", "did", "can", "could", "should", "would", "what", "which", "who", "whom", "how", "when", "why", "his", "her", "he", "she", "it", "of", "in", "on", "at", "to", "for", "with", "about", "tell", "me", "you", "your", "please", "and", "or", "does", "have", "has", "had", "any", "some", "know", "i", "want"]);

  function normalize(text) {
    return text.toLowerCase().replace(/[^\w\s+#./-]/g, " ").replace(/\s+/g, " ").trim();
  }

  function tokenize(text) {
    return normalize(text).split(" ").filter((t) => t && !STOPWORDS.has(t));
  }

  function scoreIntent(query, tokens, intent) {
    let score = 0;
    for (const kw of intent.keywords) {
      if (kw.includes(" ")) {
        // Phrase keyword: strong signal
        if (query.includes(kw)) score += 3;
      } else if (tokens.includes(kw)) {
        score += 2;
      } else {
        const near = tokens.some(
          (t) => t.length > 3 && kw.length > 3 &&
            (t.startsWith(kw) || kw.startsWith(t)) &&
            Math.abs(t.length - kw.length) <= 2
        );
        const loose = !near && tokens.some(
          (t) => t.length > 4 && kw.length > 4 && (t.startsWith(kw) || kw.startsWith(t))
        );
        if (near) score += 2;      // singular/plural & close variants
        else if (loose) score += 1; // weaker prefix overlap
      }
    }
    return score;
  }

  function answer(queryRaw) {
    const query = normalize(queryRaw);
    if (!query) return { text: WELCOME, suggestions: DEFAULT_SUGGESTIONS };

    if (GREETING_RE.test(query)) {
      return {
        text: "Hello! 👋 Great to meet you. I can tell you all about Nikhil's professional background — where would you like to start?",
        suggestions: DEFAULT_SUGGESTIONS
      };
    }
    if (THANKS_RE.test(query)) {
      return {
        text: "You're welcome! Anything else you'd like to know about Nikhil?",
        suggestions: ["What projects has he built?", "How can I contact him?"]
      };
    }
    if (BYE_RE.test(query)) {
      return {
        text: "Thanks for stopping by! 👋 If you'd like to continue the conversation, Nikhil is at **nikhil.komakula@outlook.com** or on LinkedIn.",
        suggestions: []
      };
    }

    const tokens = tokenize(query);
    let best = null;
    let bestScore = 0;
    for (const intent of KB) {
      const s = scoreIntent(query, tokens, intent);
      if (s > bestScore) {
        bestScore = s;
        best = intent;
      }
    }

    if (!best || bestScore < 2) {
      return { text: FALLBACK, suggestions: DEFAULT_SUGGESTIONS };
    }
    return { text: best.answer, suggestions: best.suggestions || DEFAULT_SUGGESTIONS };
  }

  /* ============================================================
     UI
     ============================================================ */
  function el(tag, cls, attrs) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  }

  // Minimal safe renderer: escape HTML, then apply **bold** + line breaks
  function renderRich(text) {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  }

  function trackEvent(name) {
    try {
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: name, title: name, event: true });
      }
    } catch (e) { /* analytics must never break the twin */ }
  }

  function buildUI() {
    // Launcher
    const launcher = el("button", "twin-launcher", {
      type: "button",
      "aria-label": "Chat with Nikhil's digital twin",
      "aria-haspopup": "dialog",
      "aria-expanded": "false"
    });
    launcher.innerHTML =
      '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '<span class="twin-launcher__pulse" aria-hidden="true"></span>';

    // Panel
    // role=dialog without aria-modal: the panel is a non-blocking popover
    // (the page behind stays interactive), so modal semantics would be
    // dishonest to assistive tech.
    const panel = el("section", "twin-panel", {
      role: "dialog",
      "aria-label": "Chat with Nikhil's digital twin",
      hidden: ""
    });

    panel.innerHTML = `
      <header class="twin-panel__header">
        <img src="assets/img/profile.jpg" alt="" width="40" height="40" class="twin-panel__avatar" />
        <div class="twin-panel__id">
          <strong>Nikhil's Digital Twin</strong>
          <span><span class="twin-panel__dot" aria-hidden="true"></span>Online · answers instantly</span>
        </div>
        <button type="button" class="twin-panel__new" aria-label="Clear chat and start a new session" title="New chat">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>
        </button>
        <button type="button" class="twin-panel__close" aria-label="Close chat">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </header>
      <div class="twin-panel__messages" role="log" aria-live="polite" aria-label="Chat messages"></div>
      <div class="twin-panel__suggestions" aria-label="Suggested questions"></div>
      <form class="twin-panel__form">
        <label class="sr-only" for="twinInput">Ask about Nikhil's professional background</label>
        <input id="twinInput" type="text" autocomplete="off" maxlength="280"
               placeholder="Ask about experience, skills, projects…" />
        <button type="submit" aria-label="Send message">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="m3 11 18-8-8 18-2-8-8-2z"/></svg>
        </button>
      </form>
      <p class="twin-panel__note">${
        ENDPOINT
          ? "Powered by Google Gemini — messages are processed via a secure proxy and answered only from Nikhil's documented background. Chat summaries may be shared with Nikhil."
          : "Runs in your browser — questions never leave this page."
      }</p>
    `;

    document.body.append(launcher, panel);

    const messagesEl = panel.querySelector(".twin-panel__messages");
    const suggestionsEl = panel.querySelector(".twin-panel__suggestions");
    const formEl = panel.querySelector(".twin-panel__form");
    const inputEl = panel.querySelector("#twinInput");
    const closeBtn = panel.querySelector(".twin-panel__close");
    const newBtn = panel.querySelector(".twin-panel__new");

    let open = false;
    let greeted = false;
    let history = []; // [{role: 'user'|'model', content}] for the remote proxy
    let pending = false;
    let session = 0; // bumped on "new chat" so in-flight replies are dropped
    let summarySent = false; // one summary notification per conversation

    // End-of-conversation: beacon the transcript to the proxy, which
    // summarizes it and notifies Nikhil (remote mode only). sendBeacon
    // survives page unload; text/plain keeps it a simple CORS request.
    function sendSummary() {
      if (!ENDPOINT || summarySent) return;
      if (!history.some((m) => m.role === "user")) return;
      summarySent = true;
      try {
        const payload = JSON.stringify({ messages: history.slice(-16) });
        const blob = new Blob([payload], { type: "text/plain" });
        if (!(navigator.sendBeacon && navigator.sendBeacon(`${ENDPOINT}/summary`, blob))) {
          fetch(`${ENDPOINT}/summary`, { method: "POST", body: payload, keepalive: true })
            .catch(() => {});
        }
      } catch (e) { /* never break the page */ }
    }
    addEventListener("pagehide", sendSummary);

    function addMessage(text, who) {
      const msg = el("div", `twin-msg twin-msg--${who}`);
      msg.innerHTML = renderRich(text);
      messagesEl.appendChild(msg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return msg;
    }

    function setSuggestions(list) {
      suggestionsEl.innerHTML = "";
      for (const s of list) {
        const chip = el("button", "twin-chip", { type: "button" });
        chip.textContent = s;
        chip.addEventListener("click", () => ask(s));
        suggestionsEl.appendChild(chip);
      }
      // Chips change the messages viewport height — keep the latest
      // message fully visible instead of letting it clip at the divider
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTyping() {
      const typing = el("div", "twin-msg twin-msg--bot twin-msg--typing");
      typing.innerHTML = "<span></span><span></span><span></span>";
      messagesEl.appendChild(typing);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return typing;
    }

    function localReply(queryRaw, typing) {
      const s = session;
      const { text, suggestions } = answer(queryRaw);
      const deliver = () => {
        if (s !== session) return; // chat was reset while "typing"
        if (typing) typing.remove();
        addMessage(text, "bot");
        history.push({ role: "model", content: text });
        setSuggestions(suggestions);
        pending = false;
      };
      if (prefersReducedMotion || !typing) deliver();
      else setTimeout(deliver, 450 + Math.min(text.length, 600) * 0.6);
    }

    async function remoteReply(queryRaw, typing) {
      const s = session;
      try {
        const res = await fetch(`${ENDPOINT}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history.slice(-8) }),
        });
        if (s !== session) return; // chat was reset mid-flight
        if (!res.ok) throw new Error(`proxy ${res.status}`);
        const data = await res.json();
        if (!data.reply) throw new Error("empty reply");
        typing.remove();
        addMessage(data.reply, "bot");
        history.push({ role: "model", content: data.reply });
        setSuggestions([]);
        pending = false;
      } catch (e) {
        if (s !== session) return;
        // Graceful degradation: answer from the local knowledge base
        localReply(queryRaw, typing);
      }
    }

    function botReply(queryRaw) {
      setSuggestions([]);
      const typing = prefersReducedMotion && !ENDPOINT ? null : showTyping();
      if (ENDPOINT) remoteReply(queryRaw, typing);
      else localReply(queryRaw, typing);
    }

    function ask(q) {
      const query = q.trim();
      if (!query || pending) return;
      pending = true;
      addMessage(query, "user");
      history.push({ role: "user", content: query.slice(0, 600) });
      inputEl.value = "";
      botReply(query);
    }

    function openPanel() {
      open = true;
      panel.removeAttribute("hidden");
      launcher.setAttribute("aria-expanded", "true");
      launcher.classList.add("twin-launcher--open");
      if (!greeted) {
        greeted = true;
        addMessage(WELCOME, "bot");
        setSuggestions(DEFAULT_SUGGESTIONS);
      }
      inputEl.focus();
      trackEvent("twin-open");
    }

    function closePanel() {
      open = false;
      panel.setAttribute("hidden", "");
      launcher.setAttribute("aria-expanded", "false");
      launcher.classList.remove("twin-launcher--open");
      launcher.focus();
      sendSummary();
    }

    function resetChat() {
      sendSummary(); // summarize the conversation being discarded
      session++;
      pending = false;
      history = [];
      summarySent = false; // new conversation, new summary
      messagesEl.innerHTML = "";
      addMessage(WELCOME, "bot");
      setSuggestions(DEFAULT_SUGGESTIONS);
      inputEl.value = "";
      inputEl.focus();
      trackEvent("twin-new-chat");
    }

    launcher.addEventListener("click", () => (open ? closePanel() : openPanel()));
    closeBtn.addEventListener("click", closePanel);
    newBtn.addEventListener("click", resetChat);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && open) closePanel();
    });

    // Simple focus trap while open
    panel.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const focusables = panel.querySelectorAll("button, input");
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();
      ask(inputEl.value);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildUI);
  } else {
    buildUI();
  }
})();
