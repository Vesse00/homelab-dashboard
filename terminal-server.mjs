import { Server } from 'socket.io';
import pty from 'node-pty';
import os from 'os';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const PORT = process.env.TERMINAL_PORT ? parseInt(process.env.TERMINAL_PORT, 10) : 3004;

const io = new Server(PORT, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

console.log(`\n==============================================`);
console.log(`🚀 [Terminal Server] Uruchomiony na porcie ${PORT}`);
console.log(`==============================================\n`);

io.on('connection', (socket) => {
  console.log(`[Terminal] Nowe połączenie od: ${socket.handshake.address}. Oczekiwanie na autoryzację...`);
  
  let ptyProcess = null;
  let isAuthenticated = false;

  socket.on('authenticate', async ({ email, password }) => {
    try {
      console.log(`[Terminal] Próba autoryzacji dla: ${email}`);
      if (!email || !password) {
        throw new Error('Brak danych logowania (puste hasło lub email)');
      }

      const user = await prisma.user.findUnique({ where: { email } });
      
      // --- SEKCJA DEBUGOWANIA ---
      if (!user) {
        console.log(`[Terminal] ❌ Błąd: Użytkownik nie istnieje w bazie danych!`);
      } else {
        console.log(`[Terminal] ✓ Znaleziono użytkownika. Rola: ${user.role}, Posiada hasło w bazie: ${!!user.password}`);
        
        if (user.role !== 'ADMIN') {
           console.log(`[Terminal] ❌ Błąd: Użytkownik nie ma roli ADMIN.`);
        }
        if (user.password) {
           const isValid = await bcrypt.compare(password, user.password);
           console.log(`[Terminal] ❓ Wynik weryfikacji hasła (bcrypt): ${isValid ? 'ZGODNE' : 'NIEZGODNE'}`);
        } else {
           console.log(`[Terminal] ❌ Błąd: Użytkownik nie ma ustawionego hasła w bazie!`);
        }
      }
      // --- KONIEC SEKCJI DEBUGOWANIA ---

      if (user && user.role === 'ADMIN' && user.password && await bcrypt.compare(password, user.password)) {
        isAuthenticated = true;
        socket.emit('auth_success');
        console.log(`[Terminal] ✓ Autoryzacja w pełni udana dla admina: ${email}`);
        
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
        
        ptyProcess = pty.spawn(shell, [], {
          name: 'xterm-color',
          cols: 80,
          rows: 24,
          cwd: process.env.HOME || process.cwd(),
          env: process.env
        });

        ptyProcess.onData((data) => {
          socket.emit('output', data);
        });

      } else {
        console.log(`[Terminal] ❌ Odmowa dostępu dla: ${email}`);
        socket.emit('auth_fail', 'Odmowa dostępu. Błędne hasło lub brak uprawnień ADMIN.');
        socket.disconnect();
      }
    } catch (err) {
      console.error(`[Terminal] Błąd serwera podczas weryfikacji:`, err);
      socket.emit('auth_fail', 'Błąd serwera podczas weryfikacji.');
      socket.disconnect();
    }
  });

  socket.on('input', (data) => {
    if (isAuthenticated && ptyProcess) {
      ptyProcess.write(data);
    }
  });

  socket.on('resize', ({ cols, rows }) => {
    if (isAuthenticated && ptyProcess) {
      try {
        ptyProcess.resize(cols, rows);
      } catch (e) {}
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Terminal] Rozłączono.`);
    if (ptyProcess) {
      ptyProcess.kill();
    }
  });
});