# Sova – your AI reading companion. (Sova means Owl.)

A modern web application for reading EPUB books and generating AI illustrations with seamless integration.

## Features
- **EPUB Reader**: Upload and read EPUB books with bookmarks, navigation, and font controls.
- **Dual AI Modes**:
  - **Static Mode**: Generate AI illustrations from page content or selected text
  - **Streaming Mode**: Real-time AI video generation with webcam integration
- **AI Image Generation**: Intelligent text summarization and illustration creation
- **Art Style Selection**: Choose from multiple AI art styles (Futuristic, Fantasy, Cyberpunk, Anime, and more) — your choice is persistent
- **Multi-language Support**: Full internationalization (Russian/English)

## AI Models Used

- **Text Summarization:** [AI Summary Agent](https://intelligence.io.solutions/) (via io.net)
- **Image Generation:** [Stable Diffusion models](https://daydream.live/) (via Daydream API)
- **Streaming AI:** Real-time AI video generation (via Daydream API)

> The app uses io.net's AI agents for intelligent text summarization and Daydream's streaming API for AI image and video generation. The streaming mode provides real-time AI-generated content based on your EPUB reading.

## Local Development

Follow these steps to set up Sova locally:

1. **Clone the repository**
    ```bash
    git clone https://github.com/alekcangp/daydreambook.git
    cd daydreambook
    ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
    - Copy `.env.example` to `.env`
    - Fill in your API credentials:
      - `VITE_IO_API_KEY`: Get from [io.net](https://intelligence.io.solutions/)
      - `VITE_DAYDREAM_API_KEY`: Get from [Daydream](https://app.daydream.live/beta/api-key)

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

5. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

## Deployment

- Click the button below to deploy your own instance to Vercel with one click:

  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/alekcangp/daydreambook)

- Ensure all environment variables are set in the Vercel dashboard (case-sensitive). See `.env.example` for required variables.


## License

MIT
