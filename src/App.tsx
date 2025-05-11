import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
} from "react-hook-form";

type Inputs = {
  userName: string;
};

function App() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const onValid: SubmitHandler<Inputs> = (data) => {
    console.log("form valid, data:", data);
  };

  const onInvalid: SubmitErrorHandler<Inputs> = (errors) => {
    console.log("form invalid, errors:", errors);
  };

  return (
    <>
      <h1>GitHub user search</h1>
      <h2>Narvi recruitment assignment</h2>

      <form onSubmit={handleSubmit(onValid, onInvalid)}>
        <div>
          <input
            placeholder="GitHub username"
            {...register("userName", {
              required: true,
            })}
          />
          {errors.userName && <div>This field is invalid!</div>}
        </div>
        <input type="submit" />
      </form>
    </>
  );
}

export default App;
