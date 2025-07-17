# Technology Stack

## Frontend (ui-webcdu/)
- **React 19** with TypeScript
- **Vite** as build tool and dev server
- **React Flow** for canvas, drag-and-drop, and node connections
- **Shadcn/ui** component library with Radix UI primitives
- **Tailwind CSS** for styling with animations
- **Lucide React** for icons
- **Next Themes** for dark/light mode support

## Backend (backend/)
- **FastAPI** (Python) for REST API
- **Uvicorn** ASGI server
- **CORS middleware** enabled for frontend communication
- Custom CDU generator module for ANATEM export format

## Common Commands

### Frontend Development
```bash
cd ui-webcdu
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend Development
```bash
cd backend
pip install -r requirements.txt  # Install dependencies
uvicorn main:app --reload        # Start development server
```

### Full Stack Development
- Frontend runs on Vite dev server (typically port 5173)
- Backend API runs on Uvicorn (typically port 8000)
- CORS is configured to allow cross-origin requests during development

## Key Dependencies
- **reactflow**: Core canvas and node management
- **@radix-ui/***: Accessible UI primitives
- **class-variance-authority**: Component variant management
- **cmdk**: Command palette functionality
- **sonner**: Toast notifications