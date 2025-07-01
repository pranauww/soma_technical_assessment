import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchPexelsImage } from '@/lib/pexels';

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        dependencies: {
          include: { to: true },
        },
      },
    });
    // Format dependencies as array of todo objects and ensure proper date serialization
    const formatted = todos.map(todo => ({
      ...todo,
      dueDate: todo.dueDate ? todo.dueDate.toISOString() : null,
      createdAt: todo.createdAt.toISOString(),
      dependencies: todo.dependencies.map((dep: any) => ({
        ...dep.to,
        dueDate: dep.to.dueDate ? dep.to.dueDate.toISOString() : null,
        createdAt: dep.to.createdAt.toISOString(),
      })),
    }));
    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, dueDate, dependencyIds } = await request.json();
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Fetch relevant image from Pexels API
    let imageUrl = null;
    try {
      imageUrl = await searchPexelsImage(title);
    } catch (error) {
      console.error('Failed to fetch image:', error);
      // Continue without image if API fails
    }
    
    // Handle date properly - convert YYYY-MM-DD to local date
    let processedDueDate = null;
    if (dueDate) {
      // Create date in local timezone by adding time component
      const [year, month, day] = dueDate.split('-').map(Number);
      processedDueDate = new Date(year, month - 1, day, 12, 0, 0); // Noon to avoid timezone issues
    }
    
    // Create the todo
    const todo = await prisma.todo.create({
      data: {
        title,
        dueDate: processedDueDate,
        imageUrl,
        dependents: dependencyIds && dependencyIds.length > 0 ? {
          create: dependencyIds.map((depId: number) => ({ fromId: depId }))
        } : undefined,
      },
      include: {
        dependencies: {
          include: { to: true },
        },
      },
    });
    // Format dependencies as array of todo objects and ensure proper date serialization
    const formatted = {
      ...todo,
      dueDate: todo.dueDate ? todo.dueDate.toISOString() : null,
      createdAt: todo.createdAt.toISOString(),
      dependencies: todo.dependencies.map((dep: any) => ({
        ...dep.to,
        dueDate: dep.to.dueDate ? dep.to.dueDate.toISOString() : null,
        createdAt: dep.to.createdAt.toISOString(),
      })),
    };
    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating todo' }, { status: 500 });
  }
}