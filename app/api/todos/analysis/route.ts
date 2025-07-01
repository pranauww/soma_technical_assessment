import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeTasks } from '@/lib/dependency-utils';

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

    // Format todos to match the expected interface
    const formattedTodos = todos.map(todo => ({
      ...todo,
      dueDate: todo.dueDate ? todo.dueDate.toISOString() : null,
      createdAt: todo.createdAt.toISOString(),
      dependencies: todo.dependencies.map((dep: any) => ({
        ...dep.to,
        dueDate: dep.to.dueDate ? dep.to.dueDate.toISOString() : null,
        createdAt: dep.to.createdAt.toISOString(),
      })),
    }));

    // Analyze tasks for critical path and earliest start dates
    const analysis = analyzeTasks(formattedTodos);

    return NextResponse.json({
      todos: formattedTodos,
      analysis: analysis.map(task => ({
        ...task,
        earliestStartDate: task.earliestStartDate ? task.earliestStartDate.toISOString() : null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error analyzing todos' }, { status: 500 });
  }
} 