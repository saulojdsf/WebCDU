# 🛠️ Product Requirements Document (PRD)
**Projeto:** Control Loop Designer Webapp  
**Versão:** 1.0  
**Autor:** Saulo Silva  
**Data:** 14/07/2025

---

## 1. Visão Geral

### 1.1 Objetivo
Desenvolver uma aplicação web interativa para criação de diagramas de malhas de controle, onde o usuário pode arrastar blocos de uma barra lateral para um canvas, conectar os blocos, editar parâmetros e exportar o diagrama para o formato CDU (ANATEM).

### 1.2 Público-alvo
Engenheiros elétricos, analistas de estudos de estabilidade, desenvolvedores de modelos ANATEM, consultores e pesquisadores da área de controle em sistemas de potência.

---

## 2. Funcionalidades

### 2.1 Criação de Diagrama
- Área de desenho (canvas) com suporte a zoom, pan e múltipla seleção.
- Sidebar com blocos básicos: **Input**, **Output**, **Gain**.
- Funcionalidade de **arrastar e soltar** blocos no canvas.

### 2.2 Conexões
- Blocos podem ser conectados via **portas de entrada (vin)** e **saída (vout)**.
- Se um `vout` for renomeado, todos os `vin` conectados a ele devem ser automaticamente atualizados.
- Snap opcional para facilitar alinhamento.

### 2.3 Edição de Parâmetros
- Ao clicar em um bloco, uma modal exibe seus parâmetros.
- Alguns parâmetros são desabilitados dependendo do tipo de bloco.
- Alterações são salvas automaticamente ao mudar qualquer campo.

### 2.4 Gerenciamento de Diagrama
- Armazenamento local automático.
- Funções de **Salvar** e **Abrir** (em JSON).
- Função de **Exportar** em formato CDU (texto/export para backend).
- IDs dos blocos são resetados ao limpar o canvas.

### 2.5 Aparência e Interação
- Suporte a **modo claro e escuro**.
- Shortcuts comuns:
  - **CTRL+C**: Copiar nós selecionados
  - **CTRL+V**: Colar nós copiados (com IDs únicos)
  - **DELETE**: Deletar nós/conexões selecionados
  - **CTRL+Z**: Desfazer (onde aplicável)
- Botões de zoom e centralizar visualização.
- Interface responsiva e moderna (usando Tailwind + Shadcn + React Flow).

---

## 3. Requisitos Técnicos

### 3.1 Frontend
- **React** (com Vite)
- **React Flow** para canvas e conexões
- **Shadcn/ui** para componentes
- **Tailwind CSS** para estilos

### 3.2 Backend
- **FastAPI (Python)** exposto via API REST
- Endpoint principal: `/export` que recebe JSON e retorna texto CDU
- Rodando com Uvicorn

---

## 4. Fluxo do Usuário

1. O usuário abre o app e vê o canvas vazio e a sidebar.
2. Ele arrasta um bloco "Input", depois "Gain", depois "Output".
3. Conecta os blocos.
4. Clica em cada bloco e define parâmetros.
5. Renomeia o `vout` do bloco Gain; o `vin` do próximo bloco é atualizado.
6. **Copia e cola blocos** usando CTRL+C/CTRL+V para duplicar configurações (IDs são automaticamente únicos).
7. Exporta o arquivo CDU.

---

## 5. Restrições

- Diagrama será salvo apenas localmente (sem backend de autenticação ou banco de dados).
- A exportação será suportada apenas no formato CDU.
- O app é público, não requer login.

---

## 6. Métricas de Sucesso

- Criar e exportar diagramas CDU funcionalmente corretos.
- Experiência fluida com drag & drop, conexão e edição.
- Usuários conseguindo montar diagramas completos em menos de 5 minutos.

---

## 7. Itens Futuros (Não incluídos nesta versão)

- Suporte a mais blocos (PI, somador, saturador, etc).
- Importação de arquivos CDU.
- Compartilhamento online / cloud save.
- Validação semântica dos diagramas.
- Simulação online de malhas simples.
