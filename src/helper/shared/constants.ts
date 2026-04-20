class GlobalConstants {
    //Message
    public static genericError: string = 'Something went wrong. Please try again later';

    //Regex
    public static nameRegex: string = '[a-zA-Z0-9 ]*';
    public static emailRegex: string = '[A-Za-z0-9._%-]+@[A-Za-z0-9._%-]+\\.[a-z]{2,3}';
    public static contactNumberRegex: string = '/^(\+855|0)[1-9]\d{7,8}$/';

    //Error
    public static error: string = 'error';

    //Success
    public static success: string = 'success';

    //Auth
    public static unauthorized: string = 'You are not authorize person to access this page';
}

export default GlobalConstants;
