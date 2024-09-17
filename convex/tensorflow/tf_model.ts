"use node"


import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action } from "../_generated/server";
import { dataMakeTensors, make_dummy_data } from "./data";
import { mappings } from "./tf_fn_mapping";
import tf, { layers } from "@tensorflow/tfjs";
import { Doc, Id } from "../_generated/dataModel";

 const build_model = (model: tf.Sequential,  model_layers:any, options:any) =>
{
    model.resetStates()
    for (const layer of model_layers) {
        if (layer.name in mappings)
        {
            const key = layer.name as keyof typeof mappings;
            const constructed_params:any = {}

            layer.parameters.map((param:any) => constructed_params[param.name] = param.value)

            console.log("Name", layer.name, "params", constructed_params)

            model.add(mappings[key](constructed_params));
        }
    }
    const optimizer = tf.train.adam();
    model.compile({
        optimizer: optimizer,
        loss: options.loss,
        metrics: [options.metrics],
    });
}

export const run_model = async(_model: Doc<"model">, dataset: Doc<"dataref">, ctx:any, compileOptions: any) => {

    const model = tf.sequential();


    const TRAIN_COUNT = Math.floor(dataset.data.x.length * 0.37)
    const TEST_COUNT = Math.floor(dataset.data.x.length * 0.25)


    const [train, validation, test] = dataMakeTensors(dataset, TRAIN_COUNT, TEST_COUNT);
    build_model(model, _model.layers, compileOptions)

    await model.fit(train.x, train.y, {
        batchSize: compileOptions.batchSize,
        validationData: [validation.x, validation.y],
        epochs: compileOptions.epochs,
        shuffle: true,
        callbacks: {
            onTrainBegin: async () => {
            console.log("onTrainBegin")
            },
            onTrainEnd: async () => {
            console.log("onTrainEnd")
            },
            onBatchEnd: async (epoch, logs) => {
                await ctx.runMutation(internal.model.updateModel_Logs, {logs: logs, id:_model._id, batchNum:epoch})
            }
        }})

    // const result = (model.evaluate(test.x, test.y))


}

export const run_container = action({
  args: {
    id: v.id('container'),
    options: v.object({
        batchSize: v.number(),
        epochs:v.number(),
        loss:v.string(),
        metrics:v.string()}
        )
    },
  handler: async (ctx, args) => {

    console.log("??????/")
    const container = await ctx.runQuery(internal.container.getInternalContainer, {id:args.id})
    console.log("!!!!!!!!!")
    console.log("container", container)
    if (!container)
        throw "No container found";
    if (!container.dataset)
        throw "No dataset found";
    if (!container.models)
        throw "No models found";

    await ctx.runMutation(internal.container.saveContainerOptions, {id: args.id, options:args.options})
    console.log("here")
    const _dataset = await ctx.runQuery(internal.data.getSet, {id: container.dataset})
    console.log("_dataset", _dataset);

    if (!_dataset)
        throw "Nop dataset found"

    const _dataref = await ctx.runQuery(internal.data.getRef, {id: _dataset.dataref})
     if (!_dataref)
        throw "Nop dataset found"

     console.log("_dataref", _dataref)

    // const data = make_dummy_data();

    for (let model_id of container.models) {
        console.log("model_id", model_id)
        let model = await ctx.runQuery(internal.model.getModel, {id: model_id})
        console.log("model", model)
        if (model) {
            run_model(model, _dataref, ctx, args.options)
        }
    }

    // console.log("result", result)
}});
