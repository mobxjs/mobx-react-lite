import { action, computed, observable } from "mobx"
import React from "react"

export interface ITodo {
    id: number
    text: string
    finished: boolean
}

/**
 * TodoStore is the single data store for this example.
 * It is expanded on the example from the mobx docs: https://github.com/mobxjs/mobx#computed-values
 */
export class TodoStore {
    @observable public todos: ITodo[]

    constructor(todos: ITodo[] = []) {
        this.todos = todos
    }

    @computed
    get unfinishedTodoCount() {
        return this.todos.filter(todo => !todo.finished).length
    }

    @action
    public addTodo(text: string) {
        this.todos.push({ id: Math.random(), text, finished: false })
    }

    @action
    public removeTodo(id: number) {
        const idx = this.todos.findIndex(t => t.id === id)
        this.todos.splice(idx, 1)
    }
}

// This is a global reusable context that allows components to take advantage of the useContext hook.
export const TodoStoreContext = React.createContext<TodoStore>(new TodoStore())
