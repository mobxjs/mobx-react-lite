import React from 'react';
import {render} from 'react-dom';
import {TodoStore, TodoStoreContext} from './store';
import {TodoForm} from './todoForm';
import {TodoList} from './todoList';

const store = new TodoStore();
store.addTodo("clean up tech debt");
store.addTodo("go outside during daylight hours");

render(
    <TodoStoreContext.Provider value={store}>
        <div className="container">
            <h1>My Todo List</h1>
            <TodoList/>
            <TodoForm/>
        </div>
    </TodoStoreContext.Provider>,
    document.getElementById('root')
);
