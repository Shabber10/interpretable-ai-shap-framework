# Interpretable AI Framework Architecture

Since the image generation service is currently unavailable, I have created a detailed **Mermaid Architecture Diagram** for your project. This is standard for technical documentation, and ChatGPT can easily understand and describe it as well. 

You can preview the diagram directly below:

```mermaid
graph TD
    %% Define Styles
    classDef frontend fill:#1e1e2f,stroke:#6366f1,stroke-width:2px,color:#fff;
    classDef backend fill:#2d2d3f,stroke:#a855f7,stroke-width:2px,color:#fff;
    classDef ml fill:#1b3a4b,stroke:#06d6a0,stroke-width:2px,color:#fff;
    classDef data fill:#3d2b1f,stroke:#ff9f1c,stroke-width:2px,color:#fff;
    classDef explain fill:#3a0ca3,stroke:#f72585,stroke-width:2px,color:#fff;

    %% Data Layer
    subgraph Data_Layer ["Data Layer"]
        D1[(Synthetic Dataset \n sample_data.csv)]:::data
    end

    %% Machine Learning & Explainability
    subgraph Core_Engine ["Machine Learning & Explainability Engine"]
        ML1[XGBoost Classifier \n Model Training]:::ml
        ML2[Prediction Logic]:::ml
        XAI1[SHAP Explainer \n Global & Local]:::explain
        XAI2[Plot Generation \n Waterfall/Beeswarm]:::explain
    end

    %% Backend API (Flask)
    subgraph Backend ["Backend API (Flask - app.py)"]
        API1[/Route: GET / \n Serves Dashboard/]:::backend
        API2[/Route: POST /train \n Initiates Training/]:::backend
        API3[/Route: POST /predict \n Handles Predictions/]:::backend
    end

    %% Frontend UI
    subgraph Frontend ["Frontend (Glassmorphism UI - index.html)"]
        UI1[Dashboard & Overview]:::frontend
        UI2[Model Training Console]:::frontend
        UI3[Prediction Engine]:::frontend
        UI4[Interpretability Lab]:::frontend
    end

    %% Connections - Training Flow
    D1 -->|Loads Data| ML1
    UI2 -->|Initiates via /train| API2
    API2 -->|Triggers| ML1
    ML1 -->|Fits Model| XAI1
    XAI1 -->|Generates Global Plots| XAI2
    XAI2 -->|Returns Plot Paths| API2
    API2 -->|Updates UI| UI2

    %% Connections - Prediction Flow
    UI3 -->|Sends Applicant Data| API3
    API3 -->|Passes Features| ML2
    ML2 -->|Predicts Outcome| XAI1
    XAI1 -->|Calculates Local SHAP| XAI2
    XAI2 -->|Generates Waterfall| API3
    API3 -->|Returns Probability & Insights| UI3
    UI3 -->|Displays Results| UI4
```

### How to use this for your report:
1. **In ChatGPT:** If you copy and paste this entire markdown block (including the code section starting with ` ```mermaid `), ChatGPT will understand the exact structure and can write a rich textual description of the architecture.
2. **In your actual report:** You can use tools like [Mermaid Live Editor](https://mermaid.live/) to paste the code above, which will instantly generate a high-quality, downloadable PNG/SVG image of your system architecture!
