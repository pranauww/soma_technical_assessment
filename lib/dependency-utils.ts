import { Todo } from '@prisma/client';

export interface TodoWithDependencies extends Todo {
  dependencies: Todo[];
}

export interface TaskAnalysis {
  id: number;
  title: string;
  earliestStartDate: Date | null;
  duration: number; // Assuming 1 day duration for simplicity
  criticalPath: boolean;
  dependencies: number[];
  dependents: number[];
}

// Calculate earliest start date for each task based on dependencies
export function calculateEarliestStartDates(todos: TodoWithDependencies[]): Map<number, Date | null> {
  const earliestStartDates = new Map<number, Date | null>();
  const visited = new Set<number>();

  function dfs(todoId: number): Date | null {
    if (visited.has(todoId)) {
      return earliestStartDates.get(todoId) || null;
    }

    visited.add(todoId);
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return null;

    // If no dependencies, can start immediately
    if (!todo.dependencies || todo.dependencies.length === 0) {
      const startDate = new Date(); // Today
      earliestStartDates.set(todoId, startDate);
      return startDate;
    }

    // Find the latest finish date among dependencies
    let latestDependencyFinish = new Date(0); // Earliest possible date
    for (const dep of todo.dependencies) {
      const depStartDate = dfs(dep.id);
      if (depStartDate) {
        // Add 1 day duration to get finish date
        const depFinishDate = new Date(depStartDate);
        depFinishDate.setDate(depFinishDate.getDate() + 1);
        
        if (depFinishDate > latestDependencyFinish) {
          latestDependencyFinish = depFinishDate;
        }
      }
    }

    earliestStartDates.set(todoId, latestDependencyFinish);
    return latestDependencyFinish;
  }

  // Calculate for all todos
  todos.forEach(todo => {
    if (!visited.has(todo.id)) {
      dfs(todo.id);
    }
  });

  return earliestStartDates;
}

// Find the critical path (longest path of dependent tasks)
export function findCriticalPath(todos: TodoWithDependencies[]): number[] {
  const earliestStartDates = calculateEarliestStartDates(todos);
  const finishDates = new Map<number, Date>();
  
  // Calculate finish dates for all tasks
  todos.forEach(todo => {
    const startDate = earliestStartDates.get(todo.id);
    if (startDate) {
      const finishDate = new Date(startDate);
      finishDate.setDate(finishDate.getDate() + 1); // 1 day duration
      finishDates.set(todo.id, finishDate);
    }
  });

  // Find the task with the latest finish date
  let latestFinishDate = new Date(0);
  let latestTaskId = -1;

  finishDates.forEach((finishDate, taskId) => {
    if (finishDate > latestFinishDate) {
      latestFinishDate = finishDate;
      latestTaskId = taskId;
    }
  });

  // Backtrack from the latest task to find the critical path
  const criticalPath: number[] = [];
  let currentTaskId = latestTaskId;

  while (currentTaskId !== -1) {
    criticalPath.unshift(currentTaskId);
    
    const currentTask = todos.find(t => t.id === currentTaskId);
    if (!currentTask || !currentTask.dependencies || currentTask.dependencies.length === 0) {
      break;
    }

    // Find the dependency that leads to the latest start date
    let latestDependencyId = -1;
    let latestDependencyFinish = new Date(0);

    for (const dep of currentTask.dependencies) {
      const depFinishDate = finishDates.get(dep.id);
      if (depFinishDate && depFinishDate > latestDependencyFinish) {
        latestDependencyFinish = depFinishDate;
        latestDependencyId = dep.id;
      }
    }

    currentTaskId = latestDependencyId;
  }

  return criticalPath;
}

// Analyze all tasks for critical path and earliest start dates
export function analyzeTasks(todos: TodoWithDependencies[]): TaskAnalysis[] {
  const earliestStartDates = calculateEarliestStartDates(todos);
  const criticalPath = findCriticalPath(todos);
  const criticalPathSet = new Set(criticalPath);

  // Build dependency and dependent maps
  const dependentsMap = new Map<number, number[]>();
  todos.forEach(todo => {
    dependentsMap.set(todo.id, []);
  });

  todos.forEach(todo => {
    if (todo.dependencies) {
      todo.dependencies.forEach(dep => {
        const dependents = dependentsMap.get(dep.id) || [];
        dependents.push(todo.id);
        dependentsMap.set(dep.id, dependents);
      });
    }
  });

  return todos.map(todo => ({
    id: todo.id,
    title: todo.title,
    earliestStartDate: earliestStartDates.get(todo.id) || null,
    duration: 1, // 1 day duration
    criticalPath: criticalPathSet.has(todo.id),
    dependencies: todo.dependencies?.map(d => d.id) || [],
    dependents: dependentsMap.get(todo.id) || [],
  }));
}

// Format date for display
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
} 