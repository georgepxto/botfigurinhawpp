# Bot de Figurinhas WhatsApp

Este é um bot simples para criar figurinhas (normais e animadas) no WhatsApp.

## 🚀 Como instalar

1. **Dependências já instaladas**: Você já instalou os pacotes necessários.
   Caso precise reinstalar no futuro:
   ```bash
   npm install whatsapp-web.js qrcode-terminal sharp fluent-ffmpeg ffmpeg-static
   ```

## 🤖 Como rodar

1. No terminal, execute:
   ```bash
   node index.js
   ```
2. Um **QR Code** aparecerá no terminal.
3. Abra o seu WhatsApp no celular.
4. Vá em **Mais opções (três pontos) > Aparelhos conectados > Conectar um aparelho**.
5. Aponte a câmera para o QR Code no terminal.
6. O bot avisará quando estiver pronto!

## 📝 Como usar

O bot funciona enviando comandos junto com mídias para si mesmo ou em grupos onde ele está.

| Comando              | Descrição                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------- |
| `!fig` ou `!sticker` | Envie este comando na legenda de uma **foto** ou **vídeo/GIF** para transformar em figurinha. |

### Regras

- **Imagens**: Serão convertidas para figurinhas estáticas.
- **Vídeos/GIFs**: Serão cortados para no máximo 5 segundos e convertidos em figurinhas animadas.
- **Silêncio**: O bot **NÃO** responderá a nenhuma mensagem que não comece com `!fig` ou `!sticker`.

## ⚠️ Detalhes Técnicos

- Utiliza `whatsapp-web.js` para conexão.
- `sharp` para processamento de imagens.
- `fluent-ffmpeg` / `ffmpeg-static` para processamento de vídeos.
