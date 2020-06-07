import {Request, Response} from 'express'
import knex from '../database/connection'

class PointsController {
    async create(request: Request, response: Response) {
        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        } = request.body
    
        const point = {
            image: 'image-fake',
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        };

        const trx = await knex.transaction();
    
        const insertedIds = await trx('points').insert(point)
    
        const point_id = insertedIds[0]
    
        const pointItems = items.map((item_id: number) => {
            return {
                item_id,
                point_id
            }
        })
    
        await trx('point_items').insert(pointItems)

        await trx.commit()
    
        return response.json({id: point_id,
                             ... point
                            })
    
    }

    async show(request: Request, response: Response) {
        const id = request.params.id
        const point = await knex("points").where('id', id).first()
        if(!point) {
            return response.status(404).json({message: "Point not found!"})
        }

        const items = await knex('items')
            .join('point_items', 'items.id', '=', 'point_items.item_id')
            .where('point_items.point_id', id)

        point.items = items;

        return response.json(point)
    }

    async index(request: Request, response: Response) {
        const {city, uf, items} = request.query
        const parsedItems = String(items)
            .split(',')
            .map(item => Number(item.trim()))
        
        const points = await knex("points")
            .join('point_items', 'points.id', '=', 'point_items.point_id')
            .whereIn('point_items.item_id', parsedItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('points.*')
        
        points.forEach(async (point) => {
            const result_items = await knex('items')
            .join('point_items', 'items.id', '=', 'point_items.item_id')
            .where('point_items.point_id', point.id)
            point.items = result_items;
        })
        

        return response.json(points)
    }
}

export default PointsController