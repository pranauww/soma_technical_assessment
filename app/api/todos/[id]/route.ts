import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// Helper function to detect circular dependencies
async function hasCircularDependency(todoId: number, dependencyIds: number[]): Promise<boolean> {
  const visited = new Set<number>();
  const recursionStack = new Set<number>();

  async function dfs(nodeId: number): Promise<boolean> {
    if (recursionStack.has(nodeId)) {
      return true; // Circular dependency detected
    }
    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const todo = await prisma.todo.findUnique({
      where: { id: nodeId },
      include: {
        dependencies: {
          include: { to: true },
        },
      },
    });

    if (!todo) return false;

    for (const dep of todo.dependencies) {
      if (await dfs(dep.to.id)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Check if adding the new dependencies would create a cycle
  for (const depId of dependencyIds) {
    if (await dfs(depId)) {
      return true;
    }
  }

  return false;
}

export async function PATCH(request: Request, { params }: Params) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const { dependencyIds } = await request.json();

    // Check for circular dependencies
    if (dependencyIds && dependencyIds.length > 0) {
      const hasCycle = await hasCircularDependency(id, dependencyIds);
      if (hasCycle) {
        return NextResponse.json({ error: 'Circular dependency detected' }, { status: 400 });
      }
    }

    // Update dependencies
    await prisma.taskDependency.deleteMany({
      where: { fromId: id },
    });

    if (dependencyIds && dependencyIds.length > 0) {
      await prisma.taskDependency.createMany({
        data: dependencyIds.map((depId: number) => ({
          fromId: depId,
          toId: id,
        })),
      });
    }

    // Return updated todo with dependencies
    const updatedTodo = await prisma.todo.findUnique({
      where: { id },
      include: {
        dependencies: {
          include: { to: true },
        },
      },
    });

    if (!updatedTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const formatted = {
      ...updatedTodo,
      dueDate: updatedTodo.dueDate ? updatedTodo.dueDate.toISOString() : null,
      createdAt: updatedTodo.createdAt.toISOString(),
      dependencies: updatedTodo.dependencies.map((dep: any) => ({
        ...dep.to,
        dueDate: dep.to.dueDate ? dep.to.dueDate.toISOString() : null,
        createdAt: dep.to.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating todo dependencies' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    // First, delete all dependencies where this todo is the dependent (fromId)
    await prisma.taskDependency.deleteMany({
      where: { fromId: id },
    });

    // Then, delete all dependencies where this todo is the dependency (toId)
    await prisma.taskDependency.deleteMany({
      where: { toId: id },
    });

    // Finally, delete the todo itself
    await prisma.todo.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Todo deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting todo' }, { status: 500 });
  }
}
