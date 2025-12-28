# 🏥 Sistema de Gerenciamento de Clínicas Estéticas

## 📌 Sobre o Projeto
Este é um sistema completo para gerenciamento de clínicas estéticas, permitindo o cadastro de pacientes, agendamento de consultas, controle de estoque, rastreamento de tratamentos e gerenciamento de pagamentos.

## 🚀 Tecnologias Utilizadas
- **Frontend:** React.js + TypeScript
- **Autenticação:** Supabase Auth
- **Banco de Dados:** Supabase Postgres
- **Estilização:** Tailwind CSS
- **Gerenciamento de Estado:** React Context API
- **Gráficos e Dashboard:** Recharts
- **Calendário:** React Big Calendar

---

## 🛠️ Como Rodar o Projeto

### 📥 **1. Clonar o repositório**
```sh
git clone https://github.com/fuentes/clinica-estetica.git
cd clinica-estetica
```

### 📦 **2. Instalar as dependências**
```sh
npm install
# ou
yarn install
```

### 🔧 **3. Configurar as variáveis de ambiente**
Crie um arquivo `.env` na raiz do projeto e adicione as credenciais do **Supabase**:
```sh
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 🚀 **4. Rodar o servidor de desenvolvimento**
```sh
npm run dev
# ou
yarn dev
```
O projeto estará rodando em **http://localhost:5173**

---

## 🎯 Funcionalidades Principais
### 👥 **Gerenciamento de Pacientes**
- Cadastro, edição e exclusão de pacientes
- Histórico de tratamentos
- Registro de alergias e histórico médico

### 📅 **Agendamento de Consultas**
- Exibição de agenda semanal e mensal
- Cadastro de novas consultas com seleção de profissional
- Modal para visualizar detalhes das consultas

### 💳 **Pagamentos e Fluxo de Caixa**
- Registro de pagamentos de pacientes
- Exibição de histórico financeiro
- Relatórios de fluxo de caixa

### 🏥 **Controle de Estoque**
- Cadastro e gerenciamento de produtos
- Alerta de estoque baixo

### 📊 **Dashboard Interativo**
- Visão geral de consultas, faturamento e pacientes
- Gráficos interativos

---

## 🛠️ Estrutura do Projeto
```
📂 clinica-estetica
 ├── 📂 src
 │   ├── 📂 components  # Componentes reutilizáveis
 │   ├── 📂 pages       # Páginas principais
 │   ├── 📂 hooks       # Hooks customizados
 │   ├── 📂 contexts    # Context API
 │   ├── 📂 utils       # Funções auxiliares
 │   ├── 📂 lib         # Configuração do Supabase
 │   ├── 📂 types       # Tipos TypeScript
 │   ├── App.tsx       # Componente principal
 │   ├── main.tsx      # Entrada do React
 │   ├── index.css     # Estilos globais
 ├── .env.example      # Exemplo de variáveis de ambiente
 ├── package.json      # Dependências do projeto
 ├── README.md         # Documentação do projeto
```

---

## 📌 Contribuição
Se quiser contribuir com melhorias, siga os passos:
1. Faça um **fork** do repositório
2. Crie uma **branch** para sua feature
3. Envie um **pull request**

---

## 📄 Licença
Este projeto está sob a licença **MIT**.

Desenvolvido com ❤️ por **Victor Fuentes** 🚀

