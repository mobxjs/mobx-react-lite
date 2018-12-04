import React, {FormEvent, useContext, useEffect} from 'react';
import {observer} from '../../src';
import {TodoStoreContext} from './store';

export const TodoForm = observer(() => {
    const todoStore = useContext(TodoStoreContext);
    const input = React.createRef<HTMLInputElement>();

    useEffect(() => {
        if (input.current) {
            input.current.focus();
        }
    });

    const addTodo = (evt: FormEvent) => {
        evt.preventDefault();

        if (input.current) {
            todoStore.addTodo(input.current.value);
            input.current.value = "";
        }
    };

    return (
        <form className="todo-form" onSubmit={addTodo}>
            <div className="form-group">
                <label htmlFor="add-todo-input">Create Todo</label>
                <input id="add-todo-input" type="text" className="form-control" placeholder="Todo Description" ref={input}/>
            </div>
            <button type="submit" className="btn btn-primary">Save</button>
        </form>
    );
});