import { JSONFileSyncPreset } from 'lowdb/node'
import { type Request,type Response } from 'express';
import { nanoid } from 'nanoid'

import type { DB } from './types.ts';

const defaultData: DB = { tasks: [] }
const db = await JSONFileSyncPreset<DB>('data/db.json', defaultData)

export const getAll = (_, res: Response) => {
    setTimeout(() => {
        db.read();
        const { tasks } = db.data;
        res.send(
            tasks.sort((item) => item.createdDate)
        );
    }, 3000);
};

export const getCompleted = (_, res: Response) => {
    db.read();
    const { tasks } = db.data;
    res.send(
        tasks
            .filter((item) => item.completed)
            .sort((item) => item.createdDate)
    );
};

export const create = async (req: Request, res: Response) => {
    if (!req.body.text) {
        res.status(422).send('\'text\' field must be present in json');
    } else {
        const newTask = {
            id: nanoid(),
            text: req.body.text,
            completed: false,
            createdDate: new Date().getTime(),
        };
        
        await db.update(({ tasks }) => {
            tasks.push(newTask);
        });

        res.send(newTask);
    }
};

export const deleteTask = (req: Request, res: Response) => {
    const id = req.params['id'];
    if (!id) {
        res.status(422).send('\'id\' must be present in params');
    } else {
        db.read();
        const { tasks } = db.data;
        const deleted = db.data.tasks.filter((item) => item.id !== id);

        if (deleted.length === tasks.length) {
            res.status(404).send('id not found, nothing to delete');
            return;
        }

        db.data.tasks = deleted;
        db.write();
        res.send();
    }
};

export const updateText = (req: Request, res: Response) => {
    const {text} = req.body;
    const id = req.params['id'];
    if (!text) {
        res.status(422).send('\'text\' field must be present in json');
    } else if (!id) {
        res.status(422).send('\'id\' must be present in params');
    } else {
        db.read();
        const { tasks } = db.data;
        const taskForUpdate = tasks.find((item) => item.id === id);

        if (!taskForUpdate) {
            res.status(404).send('id not found, nothing to update');
            return;
        }   
        
        taskForUpdate.text = text;
        db.write();

        res.send(taskForUpdate);        
    }
};

export const complete = (req: Request, res: Response) => {
    const id = req.params['id'];
    if (!id) {
        res.status(422).send('\'id\' must be present in params');
    } else {
        db.read();
        const { tasks } = db.data;
        const taskForUpdate = tasks.find((item) => item.id === id);

        if (!taskForUpdate) {
            res.status(404).send('id not found, nothing to complete');
            return;
        }

        taskForUpdate.completed = true;
        taskForUpdate.completedDate = new Date().getTime();
        db.write();

        res.send(taskForUpdate);
    }
};

export const incomplete = (req: Request, res: Response) => {
    const id = req.params['id'];
    if (!id) {
        res.status(422).send('\'id\' must be present in params');
    } else {
        db.read();
        const { tasks } = db.data;
        const taskForUpdate = tasks.find((item) => item.id === id);

        if (!taskForUpdate) {
            res.status(404).send('id not found, nothing to incomplete');
            return;
        }

        taskForUpdate.completed = false;
        taskForUpdate.completedDate = undefined;
        db.write();

        res.send(taskForUpdate);
    }
};

