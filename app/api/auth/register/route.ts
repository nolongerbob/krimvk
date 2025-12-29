import { NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
  name: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Проверяем, существует ли пользователь
    let existingUser;
    try {
      existingUser = await getUserByEmail(validatedData.email);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { 
          error: 'Ошибка подключения к базе данных. Проверьте настройки DATABASE_URL в .env файле.',
          details: process.env.NODE_ENV === 'development' 
            ? (dbError instanceof Error ? dbError.message : String(dbError))
            : undefined
        },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }

    // Создаем пользователя
    const user = await createUser(validatedData);

    return NextResponse.json(
      { message: 'Пользователь успешно зарегистрирован', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    
    // Более детальная информация об ошибке
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Ошибка при регистрации';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.stack : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}


