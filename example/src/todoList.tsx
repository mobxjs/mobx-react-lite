import React, {useContext} from 'react';
import {observer} from '../../src';
import {TodoStoreContext} from './store';

export const TodoList = observer(() => {
    const todoStore = useContext(TodoStoreContext);

    return (
        <ul className="list-group">
        {todoStore.todos.map((todo) =>
            <li key={todo.id} className="list-group-item">{todo.text}</li>)}
        </ul>
    );
});