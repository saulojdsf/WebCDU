# Project Structure

## Root Level
```
├── backend/                 # Python FastAPI backend
├── ui-webcdu/              # React frontend application
├── node_modules/           # Root level dependencies (elkjs)
├── package.json            # Root package config
└── README.md               # Product requirements document
```

## Backend Structure (backend/)
```
backend/
├── exporter/
│   └── cdu_generator.py    # CDU format export logic
├── main.py                 # FastAPI application entry point
└── requirements.txt        # Python dependencies
```

## Frontend Structure (ui-webcdu/)
```
ui-webcdu/
├── src/
│   ├── components/         # React components (Shadcn/ui)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions and configurations
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # React entry point
│   └── global.css         # Global styles and Tailwind imports
├── public/                # Static assets
├── package.json           # Frontend dependencies and scripts
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── components.json        # Shadcn/ui configuration
└── tsconfig*.json         # TypeScript configurations
```

## Architecture Patterns

### Frontend
- **Component-based architecture** with React functional components
- **Custom hooks** for state management and business logic
- **Shadcn/ui pattern** for consistent, accessible UI components
- **React Flow** for canvas-based diagram editing
- **Local storage** for diagram persistence

### Backend
- **Modular API design** with FastAPI
- **Single responsibility** - focused on CDU export functionality
- **Separation of concerns** - export logic isolated in dedicated module

### Communication
- **REST API** communication between frontend and backend
- **JSON payload** for diagram data exchange
- **Plain text response** for CDU export format

## File Naming Conventions
- **Frontend**: PascalCase for components, camelCase for utilities
- **Backend**: snake_case for Python modules and functions
- **Configuration files**: Standard naming (package.json, tsconfig.json, etc.)