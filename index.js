const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

// Configura o caminho do ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Inicializa o cliente do WhatsApp
// LocalAuth salva a sessão para não precisar escanear o QR code sempre
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox'],
    }
});

// Exibe o QR Code no terminal
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
    console.log('Por favor, escaneie o QR Code acima com o seu WhatsApp.');
});

// Evento quando o bot estiver pronto
client.on('ready', () => {
    console.log('O Bot de Figurinhas está pronto!');
});

// Função auxiliar para verificar mensagens (incluindo as enviadas por você mesmo)
client.on('message_create', async msg => {
    // Ignora mensagens de status/broadcast
    if (msg.from === 'status@broadcast') return;

    const body = msg.body.trim();
    
    // Verifica se é um comando válido
    const isCommand = body.startsWith('!fig') || body.startsWith('!sticker');

    // Se NÃO for comando, PARE AQUI IMEDIATAMENTE.
    // Isso garante que o bot não responda a nada que não seja um comando explícito.
    if (!isCommand) return;

    try {
        console.log(`Comando recebido em ${msg.from}: ${body}`);

        // Verifica se a mensagem tem mídia
        if (!msg.hasMedia) {
            // Se o usuário mandou comando mas sem mídia, avisamos (pois ele tentou usar o bot)
            await msg.reply('❌ Envie uma imagem ou vídeo/gif junto com o comando !fig');
            return;
        }

        // Baixa a mídia
        const media = await msg.downloadMedia();
        if (!media) {
            await msg.reply('❌ Erro ao baixar a mídia. Tente novamente.');
            return;
        }

        console.log(`Mídia baixada. Tipo: ${media.mimetype}`);

        // Processamento de Imagem
        if (media.mimetype.startsWith('image/')) {
            await processImage(msg, media);
        } 
        // Processamento de Vídeo/GIF
        else if (media.mimetype.startsWith('video/')) {
            await processVideo(msg, media);
        } else {
            await msg.reply('❌ Formato não suportado. Envie apenas imagens, vídeos curtos ou GIFs.');
        }

    } catch (error) {
        console.error('Erro geral:', error);
        await msg.reply('❌ Ocorreu um erro ao processar sua solicitação.');
    }
});

// Função para processar Imagens Estáticas
async function processImage(msg, media) {
    try {
        const buffer = Buffer.from(media.data, 'base64');

        // Redimensiona para 512x512 e converte para WebP usando sharp
        // Ajustamos para garantir que a imagem fique com fundo transparente caso a proporção seja diferente
        const newBuffer = await sharp(buffer)
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .webp()
            .toBuffer();

        // Cria o objeto de mídia para enviar
        const stickerMedia = new MessageMedia('image/webp', newBuffer.toString('base64'));

        // Envia como figurinha
        await msg.reply(stickerMedia, null, {
            sendMediaAsSticker: true,
            stickerAuthor: 'Bot',
            stickerName: 'Figurinha'
        });

    } catch (error) {
        console.error('Erro ao processar imagem:', error);
        await msg.reply('❌ Erro ao converter a imagem.');
    }
}

// Função para processar Vídeos/GIFs (Figurinhas Animadas)
async function processVideo(msg, media) {
    // Caminhos temporários
    const tempInput = path.join(__dirname, `temp_in_${Date.now()}.mp4`);
    const tempOutput = path.join(__dirname, `temp_out_${Date.now()}.webp`);

    try {
        // Salva o arquivo temporariamente
        fs.writeFileSync(tempInput, media.data, { encoding: 'base64' });

        await new Promise((resolve, reject) => {
            ffmpeg(tempInput)
                .inputOptions(['-t 5']) // Limita a 5 segundos de entrada
                .outputOptions([
                    '-vcodec libwebp',
                    '-vf scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=0x00000000', // Redimensiona para 512x512 mantendo aspect ratio
                    '-loop 0',  // Loop infinito
                    '-preset default',
                    '-an',      // Remove áudio
                    '-vsync 0',
                    '-s 512x512' // Garante o tamanho final
                ])
                .save(tempOutput)
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });

        // Lê o arquivo gerado
        const webpData = fs.readFileSync(tempOutput, 'base64');
        const stickerMedia = new MessageMedia('image/webp', webpData);

        // Envia como figurinha
        await msg.reply(stickerMedia, null, {
            sendMediaAsSticker: true,
            stickerAuthor: 'Bot',
            stickerName: 'Animada'
        });

    } catch (error) {
        console.error('Erro ao processar vídeo:', error);
        await msg.reply('❌ Erro ao converter o vídeo/GIF. Verifique se o arquivo não é muito grande.');
    } finally {
        // Limpa arquivos temporários
        if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
        if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    }
}

// Inicializa o bot
client.initialize();
