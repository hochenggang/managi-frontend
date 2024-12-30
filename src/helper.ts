import { useNotification } from "@kyvg/vue3-notification";

const { notify } = useNotification()

const handleMsg = (value: string) => {
  notify({
    type: 'success',
    title: value,
  });
}

const handleError = (value: string) => {
  notify({
    type: 'error',
    title: value,
  });
}

export {
  handleMsg,
  handleError
}