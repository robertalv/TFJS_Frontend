import { Button } from "@/components/ui/button.tsx";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator.tsx";
import { useCreateModel } from "@/hooks/model/use-create-model";
import { useGlobalState } from "@/providers/StateProvider";
import { Container } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction, useQuery } from "convex/react";
import { CirclePlay } from "lucide-react";
import { useState , useEffect} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "../../convex/_generated/api";

const FormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  modelId: z.string().optional(),
})

const RunModal = ({ container }: { container: Container }) => {
  const { state, setState } = useGlobalState();
  const [selectedOption, setOptions] = useState({
    batchSize: 5,
    epochs: 5,
    loss: "meanSquaredError",
    metrics: "accuracy"
  });

  useEffect(() => {
    if (container && container.compileOptions) {
      setOptions(prevOptions => ({
        ...prevOptions,
        ...container.compileOptions
      }));
    }
  }, [container]);

  const user = useQuery(api.users.viewer);
  const { mutate, isLoading } = useCreateModel();
  const run = useAction(api.tensorflow.tf_model.run_container)

  const compile_run = async () => {
    console.log("Running...")
    setState("openRunModal", false);
    await run({id:container._id, options: selectedOption})
  }

  const options = {
    "batchSize": {  "min": 1, "max": 10, options:[]},
    "epochs": {  "min": 1, "max": 10, options: []},
    "loss": { options:
          [
            "absoluteDifference","computeWeightedLoss","cosineDistance",
            "hingeLoss","huberLoss","logLoss","meanSquaredError",
            "sigmoidCrossEntropy","softmaxCrossEntropy","binaryCrossentropy"
        ]},
    "metrics": { options: [
            "accuracy", "binaryAccuracy","binaryCrossentropy","categoricalAccuracy",
            "categoricalCrossentropy","cosineProximity","mape","meanAbsoluteError",
            "meanAbsolutePercentageError","meanSquaredError","mse","precision",
            "r2Score","recall","sparseCategoricalAccuracy",
    ]}
  }

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      modelId: container._id
    },
  })

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    console.log("values", values)
  }

  const onClose = (open: boolean) => {

    setState("openRunModal", open);
    if (!open) {
      form.reset();
    }
  };

  const getNumericOption = (field: string, key: 'min' | 'max') => {
    const option = options[field as keyof typeof options];
    return typeof option === 'object' && key in option ? (option as any)[key] : undefined;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void form.handleSubmit(onSubmit)(e);
  };

  return (
    <Dialog open={state.openRunModal} onOpenChange={onClose}>
      <DialogTrigger onClick={() => setState("openModelLayer", true)}>
        <Button className="h-7 text-xs !bg-transparent dark:!text-zinc-200 !border dark:!border-purple-400/40 hover:!border-purple-400 gap-1.5 hover:!bg-zinc-900 card-title" disabled={isLoading}>
          Compile and Run
        </Button>
      </DialogTrigger>
      <DialogContent className={'p-10 md:!w-[800px] !app-bg'}>
        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <div className={'flex flex-col justify-center items-center gap-4'}>
              <CirclePlay className={'w-10 h-10 stroke-purple-800'}/>
              <div className={'flex flex-col justify-center items-center gap-1'}>
                <span className={'text-3xl font-bold'}>
                  Compile and Run
                </span>
                <span className={'text-lg font-thin text-zinc-600'}>
                  Compile and run your models.
                </span>
              </div>

              {/* Run commands */}
              {
                Object.keys(options).map((field) => (
                    <div key={field} className={'flex flex-row items-center justify-center w-4/5 gap-x-4'}>
                        <div className="grid w-1/3 items-center gap-1.5">
                        <Label htmlFor="container" className={'text-zinc-200 font-thin'}>{field}</Label>
                        </div>
                        <div className="grid w-2/3 items-center gap-1.5">
                            {
                                typeof selectedOption[field as keyof typeof selectedOption] === "number" ? (
                                    <Input
                                        type="number"
                                        id="container"
                                        min={getNumericOption(field, 'min')}
                                        max={getNumericOption(field, 'max')}
                                        value={selectedOption[field as keyof typeof selectedOption]}
                                        onChange={(e) => setOptions({...selectedOption, [field]: Number(e.target.value)})}
                                    />
                                ) : (
                                    <Select 
                                        value={selectedOption[field as keyof typeof selectedOption] as string} 
                                        onValueChange={(e) => setOptions({...selectedOption, [field]: e})}
                                    >
                                        <SelectTrigger id="model" className="items-start [&_[data-description]]:hidden">
                                            <SelectValue placeholder={selectedOption[field as keyof typeof options]} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {
                                                options[field as keyof typeof options].options.map((val) => (
                                                    <SelectItem key={val} value={val}>
                                                        {val}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                )
                            }
                        </div>
                    </div>
                ))
              }
              <Separator className={'my-4 w-4/5'}/>

              <div className={'my-4 w-4/5 p-4 border border-muted bg-accent/50 text-sm flex items-center justify-center text-zinc-200'}>
                {
                    container.dataset ?
                    <>
                    Using dataset : {container.dataset.name} Input shape : {"[" + container.dataset.xshape.join(" ") + "]"} Output shape : { "[" + container.dataset.yshape.join(" ") + "]"}
                    </>

                        :
                    "You need to upload or use an existing dataset before you can run your model"
                }
              </div>

              <div className={'w-4/5 flex items-end justify-end'}>
                <Button disabled={!container.dataset} onClick={compile_run}>
                  Run model
                </Button>
              </div>

            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default RunModal;
