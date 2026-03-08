# 🎬 Anime Go - Streaming Mobile Experience

O **Anime Go** é um ecossistema mobile completo para amantes de anime, desenvolvido com foco em alta performance, fluidez e interface imersiva. Atualmente, o projeto está em fase final de homologação na **Google Play Store**.

> **🚀 Status do Lançamento:** Em fase de **Closed Testing** (Dia 8/14). 
> *Cumprindo os requisitos técnicos da Google para publicação em produção.*

---

## ✨ Diferenciais do Projeto

Diferente de apps simples, o Anime Go foi estruturado para escala:
* **Autenticação Robusta**: Integração completa com **Firebase Auth** (Login/Cadastro).
* **Consumo de Dados Real-time**: Sincronização de favoritos e histórico via **Firebase Firestore**.
* **Inteligência de Dados**: Consumo dinâmico da **API TMDB** para metadados, capas e sinopses em alta resolução.
* **Player Integrado**: Experiência de vídeo otimizada para dispositivos Android.

---

## 🛠️ Stack Tecnológica

* **Framework**: React Native (com Expo/EAS)
* **Linguagem**: TypeScript (Tipagem forte para evitar bugs em produção)
* **Backend as a Service**: Firebase (Auth & Firestore)
* **Consumo de API**: Axios + TMDB API
* **Estilização**: Styled Components / Tailwind Native
* **Navegação**: React Navigation (Stack & Tabs)

---

## 🎨 Arquitetura do Código

O projeto segue padrões de mercado para facilitar a manutenção:
* `src/api`: Centralização de serviços e instâncias do Axios/Firebase.
* `src/screens`: Telas organizadas (Home, Details, Player, Favorites, Profile).
* `src/types`: Definições globais de TypeScript para os dados da API.

---

## 📱 Como Testar (Acesso Antecipado)

Como o app está em teste fechado pela Google:
1. Me envie seu e-mail via **LinkedIn** ou **Direct**.
2. Eu te adicionarei à lista de testadores oficiais.
3. Você receberá o link para baixar diretamente da Play Store.

---

## 👨‍💻 Autor e Desenvolvedor

Desenvolvido por **Erik Martins** (BitSoul).
*Estudante de Análise e Desenvolvimento de Sistemas na Estácio.*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/%C3%A9rik-martins-3147b8193/)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/@erikmartinsss9)

---

### 🛡️ Licença e Segurança
*O código fonte é aberto para consulta de portfólio. Chaves de API e assinaturas de produção (.keystore) foram omitidas por segurança.*
