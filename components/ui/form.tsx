"use client";

import * as React from "react";
import {
  Controller,
  FormProvider,
  useFormContext,
  type Control,
  type FieldPath,
  type FieldValues,
  type Path,
  type UseFormReturn,
  type ControllerRenderProps,
} from "react-hook-form";

const FormItemContext = React.createContext<{ name?: string }>({});

type FormProps<TFieldValues extends FieldValues> = UseFormReturn<TFieldValues> & {
  children: React.ReactNode;
};

export function Form<TFieldValues extends FieldValues>({
  children,
  ...props
}: FormProps<TFieldValues>) {
  return <FormProvider {...(props as UseFormReturn<TFieldValues>)}>{children}</FormProvider>;
}

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>({
  control,
  name,
  render,
}: {
  control: Control<TFieldValues>;
  name: TName;
  render: (field: {
    field: ControllerRenderProps<TFieldValues, TName>;
  }) => React.ReactNode;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormItemContext.Provider value={{ name: name as string }}>
          {render({ field })}
        </FormItemContext.Provider>
      )}
    />
  );
}

export function FormItem({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function FormLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={className} {...props} />;
}

export function FormControl({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}

export const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { name } = React.useContext(FormItemContext);
    const { formState } = useFormContext();
    const error = name ? (formState.errors as any)[name]?.message : undefined;

    if (!error) {
      return null;
    }

    return (
      <p ref={ref} className={className} {...props}>
        {error as React.ReactNode}
      </p>
    );
  }
);

FormMessage.displayName = "FormMessage";
