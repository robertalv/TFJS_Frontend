import CardTitle from '@/components/CardTitle';
import ModelDrawer from "@/components/container/mobile-drawer";
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Heart,
  Share,
} from "lucide-react"
import { Container, Model } from '@/types';
import AddModelDialog from '../AddModelDialog';
import { useToggleLike } from "@/hooks/container/use-toggle-like";
import { toast } from 'sonner';

type ModelHeaderProps = {
  container: Container;
  model: Model;
  layerAttrs: any;
}

const ModelHeader = ({ container, model, layerAttrs }: ModelHeaderProps) => {
  const isLiked = container?.liked;
  const { mutate } = useToggleLike();

  const handleLike = async () => {
    mutate({ id: container._id },
      {
        onSuccess: (response) => {
          toast.success(response.message);
        },
        onError: (error) => {
          console.error("Error toggling like:", error);
        },
        onFinally: () => {
          console.log("Toggled like finally");
        },
      }
    );
  }

  return (
    <header className="sticky top-0 z-10 flex h-[53px] items-center gap-1 border-b bg-background px-4 w-full">
    <CardTitle container={container as Container} />

    <ModelDrawer layerAttrs={layerAttrs} model={model as any} container={container as any} />

    <div className={'flex justify-end items-center ml-auto space-x-2'}>
    <Button size="icon" className={'text-xs !bg-zinc-950 dark:!text-zinc-200'} onClick={handleLike}>
    <div>
      <motion.div
        initial={{ backgroundPositionY: '100%' }}
        whileHover={{ backgroundPositionY: '0%', scale: 1.2 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <Heart className={`size-3.5 ${isLiked ? 'fill-pink-500 stroke-pink-800' : ''}`} />
        <motion.div />
      </motion.div>
    </div>
    </Button>
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 h-7 text-xs !bg-transparent dark:!text-zinc-200 !border dark:!border-zinc-800 hover:!bg-zinc-900"
    >
      <Share className="size-3.5"/>
      Share
    </Button>
    <AddModelDialog container={container as Container} />
    </div>
  </header>
  )
}

export default ModelHeader;